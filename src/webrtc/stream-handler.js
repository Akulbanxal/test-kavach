import { handlePCMChunk, initModel } from '../ai/model-runner.js';

let localStream = null;
let remoteStream = null;
let localPeerConnection = null;
let remotePeerConnection = null;

let audioContext = null;
let sourceNode = null;
let workletNode = null;

export async function startSecureCall(onRemoteStream) {
    try {
        // 3. Capture microphone with raw constraints (no echo cancellation or noise suppression)
        // to prevent browser processing from distorting voice characteristics for the neural network.
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        // 4. Create peer connections for loopback
        localPeerConnection = new RTCPeerConnection();
        remotePeerConnection = new RTCPeerConnection();

        localPeerConnection.onicecandidate = e => {
            if (e.candidate) remotePeerConnection.addIceCandidate(e.candidate);
        };
        remotePeerConnection.onicecandidate = e => {
            if (e.candidate) localPeerConnection.addIceCandidate(e.candidate);
        };

        // 7. Intercept remote MediaStreamTrack using Web Audio API
        remotePeerConnection.ontrack = async (event) => {
            if (!remoteStream) {
                remoteStream = new MediaStream();
                if (typeof onRemoteStream === 'function') {
                    onRemoteStream(remoteStream);
                }
            }
            remoteStream.addTrack(event.track);

            if (!audioContext) {
                // Initialize the ONNX model FIRST before the worklet fires
                await initModel();

                audioContext = new AudioContext({ sampleRate: 16000 });
                
                // 8. Load AudioWorklet
                await audioContext.audioWorklet.addModule('/worklets/pcm-processor.js');
                
                // 9. Create AudioWorkletNode
                workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
                
                // 11. Listen to worklet messages
                // pcm-processor.js sends: { type: 'pcm-chunk', payload: Int16Array }
                workletNode.port.onmessage = (event) => {
                    const message = event.data;
                    if (message && message.type === 'pcm-chunk') {
                        if (typeof handlePCMChunk === 'function') {
                            // Read .payload (the field pcm-processor actually uses)
                            const data = message.payload || message.chunk || message.data;
                            if (data) handlePCMChunk(data);
                        }
                    }
                };

                sourceNode = audioContext.createMediaStreamSource(remoteStream);
                
                // 10. Connect graph: source -> workletNode -> destination
                sourceNode.connect(workletNode);
                workletNode.connect(audioContext.destination);
            }
        };

        // 5. Add local tracks
        localStream.getTracks().forEach(track => {
            localPeerConnection.addTrack(track, localStream);
        });

        // 6. Simulate connection
        const offer = await localPeerConnection.createOffer();
        await localPeerConnection.setLocalDescription(offer);
        await remotePeerConnection.setRemoteDescription(offer);

        const answer = await remotePeerConnection.createAnswer();
        await remotePeerConnection.setLocalDescription(answer);
        await localPeerConnection.setRemoteDescription(answer);

    } catch (error) {
        console.error("Error starting secure call:", error);
        stopSecureCall();
    }
}

export function stopSecureCall() {
    // 12. Cleanup
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
    if (localPeerConnection) {
        localPeerConnection.close();
        localPeerConnection = null;
    }
    if (remotePeerConnection) {
        remotePeerConnection.close();
        remotePeerConnection = null;
    }
    
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    if (workletNode) {
        workletNode.disconnect();
        workletNode = null;
    }
    if (audioContext) {
        if (audioContext.state !== 'closed') {
            audioContext.close();
        }
        audioContext = null;
    }
}

export function triggerLockdown() {
    // 13. Trigger lockdown: stop call & cleanup resources
    stopSecureCall();
    console.warn("LOCKDOWN TRIGGERED: Terminating call to protect user.");
}
