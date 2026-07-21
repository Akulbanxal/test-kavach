/**
 * Kavach AI — Streaming Risk State Machine
 *
 * Implements a robust state machine for tracking voice deepfake threats:
 *   SAFE -> MONITORING -> SUSPICIOUS -> CONFIRMED -> LOCKDOWN
 *
 * Transitions require consecutive frames to match criteria.
 * Hysteresis limits prevent rapid flickering of the risk state.
 */

export const RISK_STATES = {
  SAFE: 'SAFE',
  MONITORING: 'MONITORING',
  SUSPICIOUS: 'SUSPICIOUS',
  CONFIRMED: 'CONFIRMED',
  LOCKDOWN: 'LOCKDOWN'
};

let currentState = RISK_STATES.SAFE;
let consecutiveFrames = 0;
let pendingState = null;
let subscribers = [];

/**
 * Subscribe to risk state transitions.
 * @param {Function} callback - Callback function receiving transition payload ({ from, to })
 * @returns {Function} Unsubscribe hook
 */
export function subscribeToRiskState(callback) {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
  };
}

/**
 * Gets the current active state.
 * @returns {string} The active RISK_STATES state
 */
export function getRiskState() {
  return currentState;
}

/**
 * Resets the state machine back to SAFE.
 */
export function resetRiskStateMachine() {
  const oldState = currentState;
  currentState = RISK_STATES.SAFE;
  consecutiveFrames = 0;
  pendingState = null;

  if (oldState !== currentState) {
    notifySubscribers(oldState, currentState);
  }
}

function notifySubscribers(fromState, toState) {
  subscribers.forEach(callback => {
    try {
      callback({ from: fromState, to: toState });
    } catch (err) {
      console.error("[Risk State Machine] Error in subscriber callback:", err);
    }
  });
}

/**
 * Helper to map state to numerical order for direction comparison.
 */
function getStateOrder(state) {
  const orders = {
    [RISK_STATES.SAFE]: 0,
    [RISK_STATES.MONITORING]: 1,
    [RISK_STATES.SUSPICIOUS]: 2,
    [RISK_STATES.CONFIRMED]: 3,
    [RISK_STATES.LOCKDOWN]: 4
  };
  return orders[state] ?? 0;
}

/**
 * Processes a new inference frame score and returns the computed state.
 * @param {number} score - Current deepfake confidence score [0, 1]
 * @returns {string} The new risk state
 */
export function updateRiskStateMachine(score) {
  // LOCKDOWN is a terminal state; it requires a manual reset.
  if (currentState === RISK_STATES.LOCKDOWN) {
    return currentState;
  }

  // 1. Establish the raw threshold target state
  let targetState = RISK_STATES.SAFE;
  if (score >= 0.82) {
    targetState = RISK_STATES.LOCKDOWN;
  } else if (score >= 0.65) {
    targetState = RISK_STATES.CONFIRMED;
  } else if (score >= 0.40) {
    targetState = RISK_STATES.SUSPICIOUS;
  } else if (score >= 0.15) {
    targetState = RISK_STATES.MONITORING;
  } else {
    targetState = RISK_STATES.SAFE;
  }

  // 2. Apply Hysteresis Rules:
  // Downward transitions require crossing lower buffers before state changes.
  if (currentState === RISK_STATES.CONFIRMED) {
    if (score >= 0.55 && score < 0.65) {
      // Hysteresis boundary: hold CONFIRMED state
      targetState = RISK_STATES.CONFIRMED;
    } else if (score < 0.55) {
      targetState = RISK_STATES.SUSPICIOUS;
    }
  } else if (currentState === RISK_STATES.SUSPICIOUS) {
    if (score >= 0.30 && score < 0.40) {
      // Hysteresis boundary: hold SUSPICIOUS state
      targetState = RISK_STATES.SUSPICIOUS;
    } else if (score < 0.30) {
      targetState = RISK_STATES.MONITORING;
    }
  } else if (currentState === RISK_STATES.MONITORING) {
    if (score >= 0.08 && score < 0.15) {
      // Hysteresis boundary: hold MONITORING state
      targetState = RISK_STATES.MONITORING;
    } else if (score < 0.08) {
      targetState = RISK_STATES.SAFE;
    }
  }

  // 3. Apply Consecutive Frame Validation:
  if (targetState === currentState) {
    // Reset confirmation frame count if target aligns with current
    pendingState = null;
    consecutiveFrames = 0;
  } else {
    if (targetState === pendingState) {
      consecutiveFrames++;
    } else {
      pendingState = targetState;
      consecutiveFrames = 1;
    }

    // Dynamic verification counts:
    // Upward escalation is critical and fast (2 consecutive frames).
    // Downward recovery is slower and stable (3 consecutive frames).
    const isUpward = getStateOrder(targetState) > getStateOrder(currentState);
    const requiredConsecutive = isUpward ? 2 : 3;

    if (consecutiveFrames >= requiredConsecutive) {
      const oldState = currentState;
      currentState = targetState;
      pendingState = null;
      consecutiveFrames = 0;
      notifySubscribers(oldState, currentState);
      console.log(`[Risk State Machine] State Transition: ${oldState} -> ${currentState} (score=${(score*100).toFixed(1)}%)`);
    }
  }

  return currentState;
}
