'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignaturePad({ onConfirm, onCancel, loading }) {
    const sigRef = useRef(null);

    const handleClear = () => {
        sigRef.current?.clear();
    };

    const handleConfirm = () => {
        if (sigRef.current?.isEmpty()) {
            return; // Don't submit empty signature
        }
        // Get the signature as a base64 PNG data URL
        const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
        onConfirm(dataUrl);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Draw Your Signature</h3>
                <p className="text-sm text-gray-500">Sign inside the box below. Your signature will appear at this exact size on the document.</p>
            </div>

            {/* Signature Canvas — fixed size matching the "1." signature box on PDF */}
            <div className="mb-4 flex justify-center">
                <div
                    className="border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden relative"
                    style={{ width: '240px', height: '120px' }}
                >
                    <SignatureCanvas
                        ref={sigRef}
                        penColor="black"
                        canvasProps={{
                            width: 240,
                            height: 120,
                            style: { width: '240px', height: '120px' }
                        }}
                        backgroundColor="rgba(255, 255, 255, 0)"
                    />
                    {/* Signature line */}
                    <div className="absolute bottom-4 left-4 right-4 border-b border-gray-300">
                        <span className="absolute -top-4 left-0 text-[10px] text-gray-400 uppercase tracking-wider">
                            Sign here
                        </span>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={loading}
                    className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Submitting...</span>
                        </>
                    ) : (
                        <>
                            <span>Confirm Signature</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
