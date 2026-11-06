'use client';

import { useState, useEffect, useCallback } from 'react';
import SignaturePad from './SignaturePad';

const funMessages = [
    "Brewing your document with love...",
    "Teaching the PDF some manners...",
    "Convincing the pixels to line up...",
    "Almost there, pinky promise!",
    "Folding digital paper cranes...",
    "Sprinkling some magic dust...",
    "Waking up the document elves...",
    "Making it look extra official...",
    "Dotting the i's and crossing the t's...",
    "Your form is getting dressed up...",
];

export default function OTPFormViewer({ dealId, contactId, unitDetailsList = [], onClose }) {
    // Steps: 'generating' | 'viewing' | 'signing' | 'previewing' | 'processing' | 'success' | 'allComplete' | 'error'
    const [step, setStep] = useState('generating');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfProxyUrl, setPdfProxyUrl] = useState(null);
    const [originalPdfUrl, setOriginalPdfUrl] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [signingLoading, setSigningLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [signedPdfBase64, setSignedPdfBase64] = useState(null);
    const [signedPdfPreviewUrl, setSignedPdfPreviewUrl] = useState(null);
    const [currentSignatureDataUrl, setCurrentSignatureDataUrl] = useState(null);
    const [funMessageIndex, setFunMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Multi-unit tracking
    const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
    const [collectedSignedPdfs, setCollectedSignedPdfs] = useState([]); // { base64, unitName }[]
    const totalUnits = unitDetailsList.length || 1;
    const currentUnitDetails = unitDetailsList[currentUnitIndex] || null;
    const isMultiUnit = totalUnits > 1;

    // Rotate fun messages every 2.5 seconds while generating
    useEffect(() => {
        if (step !== 'generating') return;
        const interval = setInterval(() => {
            setFunMessageIndex(prev => (prev + 1) % funMessages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [step]);

    // Animate progress bar while generating (reaches ~90% then slows down)
    useEffect(() => {
        if (step !== 'generating') {
            setProgress(0);
            return;
        }
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev + 0.2;
                if (prev >= 70) return prev + 0.5;
                if (prev >= 50) return prev + 1;
                return prev + 2;
            });
        }, 200);
        return () => clearInterval(interval);
    }, [step]);

    // Generate OTP document on mount and when currentUnitIndex changes
    useEffect(() => {
        generateDocument();
    }, [dealId, currentUnitIndex]);

    // Clean up blob URLs on unmount
    useEffect(() => {
        return () => {
            if (signedPdfPreviewUrl) {
                URL.revokeObjectURL(signedPdfPreviewUrl);
            }
        };
    }, [signedPdfPreviewUrl]);

    const resetForNextUnit = () => {
        setPdfUrl(null);
        setPdfProxyUrl(null);
        setOriginalPdfUrl(null);
        setSignedPdfBase64(null);
        if (signedPdfPreviewUrl) {
            URL.revokeObjectURL(signedPdfPreviewUrl);
        }
        setSignedPdfPreviewUrl(null);
        setCurrentSignatureDataUrl(null);
        setErrorMessage('');
    };

    const generateDocument = async () => {
        try {
            setStep('generating');
            setErrorMessage('');

            const response = await fetch('/api/documents/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dealId, unitDetails: currentUnitDetails })
            });

            const data = await response.json();

            if (data.success && data.pdfUrl) {
                setOriginalPdfUrl(data.pdfUrl);
                const proxyUrl = `/api/documents/pdf?url=${encodeURIComponent(data.pdfUrl)}`;
                setPdfProxyUrl(proxyUrl);
                setPdfUrl(data.pdfUrl);
                setStep('viewing');
            } else {
                setErrorMessage(data.error || 'Failed to generate document');
                setStep('error');
            }
        } catch (error) {
            console.error('Error generating OTP document:', error);
            setErrorMessage(error.message || 'Failed to generate document');
            setStep('error');
        }
    };

    // After signature is drawn, generate a preview of the signed PDF
    const handleSignatureConfirm = async (signatureDataUrl) => {
        try {
            setPreviewLoading(true);
            setCurrentSignatureDataUrl(signatureDataUrl);

            const response = await fetch('/api/documents/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signatureBase64: signatureDataUrl,
                    pdfUrl: originalPdfUrl
                })
            });

            const data = await response.json();

            if (data.success && data.signedPdfBase64) {
                setSignedPdfBase64(data.signedPdfBase64);

                // Convert base64 to blob URL for iframe display
                const binaryString = atob(data.signedPdfBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);

                // Clean up previous blob URL if any
                if (signedPdfPreviewUrl) {
                    URL.revokeObjectURL(signedPdfPreviewUrl);
                }
                setSignedPdfPreviewUrl(blobUrl);
                setStep('previewing');
            } else {
                setErrorMessage(data.error || 'Failed to generate preview');
                setStep('error');
            }
        } catch (error) {
            console.error('Error generating preview:', error);
            setErrorMessage(error.message || 'Failed to generate preview');
            setStep('error');
        } finally {
            setPreviewLoading(false);
        }
    };

    // User confirms the preview — save signature and handle PDF collection
    const handleProceed = async () => {
        try {
            setSigningLoading(true);
            setStep('processing');

            const isLastUnit = currentUnitIndex >= totalUnits - 1;

            // For multi-unit: skip PDF upload during signing, collect PDFs to merge later
            // For single-unit: upload directly as before
            const response = await fetch('/api/documents/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    contactId,
                    signatureBase64: currentSignatureDataUrl,
                    signedPdfBase64,
                    unitName: currentUnitName,
                    skipUpload: isMultiUnit // Skip per-unit upload in multi-unit mode
                })
            });

            const data = await response.json();

            if (data.success) {
                if (isMultiUnit) {
                    // Collect this signed PDF for merging later
                    const updatedPdfs = [...collectedSignedPdfs, { base64: signedPdfBase64, unitName: currentUnitName }];
                    setCollectedSignedPdfs(updatedPdfs);

                    if (!isLastUnit) {
                        setStep('success'); // Show success, then user advances to next unit
                    } else {
                        // Last unit — merge all PDFs and upload
                        setStep('processing');
                        try {
                            const mergeResponse = await fetch('/api/documents/merge-upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dealId,
                                    signedPdfs: updatedPdfs
                                })
                            });
                            const mergeData = await mergeResponse.json();
                            if (mergeData.success) {
                                setStep('allComplete');
                            } else {
                                setErrorMessage(mergeData.error || 'Failed to merge and upload documents');
                                setStep('error');
                            }
                        } catch (mergeError) {
                            console.error('Error merging PDFs:', mergeError);
                            setErrorMessage(mergeError.message || 'Failed to merge and upload documents');
                            setStep('error');
                        }
                    }
                } else {
                    // Single unit — already uploaded, done
                    setStep('allComplete');
                }
            } else {
                setErrorMessage(data.error || 'Failed to save signed document');
                setStep('error');
            }
        } catch (error) {
            console.error('Error processing signed document:', error);
            setErrorMessage(error.message || 'Failed to process signed document');
            setStep('error');
        } finally {
            setSigningLoading(false);
        }
    };

    // Advance to next unit
    const handleNextUnit = () => {
        resetForNextUnit();
        setCurrentUnitIndex(prev => prev + 1);
        // generateDocument will be triggered by the useEffect on currentUnitIndex
    };

    // User wants to redo the signature
    const handleRedo = () => {
        setSignedPdfBase64(null);
        if (signedPdfPreviewUrl) {
            URL.revokeObjectURL(signedPdfPreviewUrl);
            setSignedPdfPreviewUrl(null);
        }
        setCurrentSignatureDataUrl(null);
        setStep('signing');
    };

    // Determine which PDF URL to show in the left panel
    const displayPdfUrl = step === 'previewing' ? signedPdfPreviewUrl : pdfProxyUrl;

    // Unit progress label
    const unitProgressLabel = isMultiUnit
        ? `Unit ${currentUnitIndex + 1} of ${totalUnits}`
        : null;
    const currentUnitName = currentUnitDetails?.unitName || '';

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] h-[95vh] overflow-hidden flex flex-col md:flex-row">

                {/* Left Panel: PDF Preview */}
                <div className="w-full md:w-8/12 lg:w-9/12 bg-gray-100 border-r border-gray-200 flex flex-col min-h-0">
                    <div className="px-6 py-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {step === 'previewing' ? 'Signed Document Preview' : 'Offer to Purchase Form'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {step === 'previewing'
                                        ? 'Review the signed document — check that the signature looks correct'
                                        : 'Review the document before signing'}
                                </p>
                            </div>
                            {isMultiUnit && step !== 'allComplete' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                        {unitProgressLabel}{currentUnitName ? `: ${currentUnitName}` : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Multi-unit progress bar */}
                        {isMultiUnit && step !== 'allComplete' && (
                            <div className="mt-2 flex gap-1">
                                {unitDetailsList.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1 flex-1 rounded-full transition-colors ${
                                            idx < currentUnitIndex ? 'bg-green-500'
                                            : idx === currentUnitIndex ? 'bg-gray-900'
                                            : 'bg-gray-200'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden">
                        {step === 'generating' ? (
                            <div className="flex flex-col items-center justify-center h-full p-8">
                                {/* Animated document illustration */}
                                <div className="relative mb-8">
                                    {/* Paper sheets stacking animation */}
                                    <div className="relative w-32 h-40">
                                        {/* Back sheet */}
                                        <div className="absolute inset-0 bg-gray-200 rounded-lg transform rotate-3 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                        {/* Middle sheet */}
                                        <div className="absolute inset-0 bg-gray-100 rounded-lg transform -rotate-2 animate-pulse" style={{ animationDelay: '0.25s' }}></div>
                                        {/* Front sheet */}
                                        <div className="absolute inset-0 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col items-center justify-center p-4 overflow-hidden">
                                            {/* Animated lines mimicking text */}
                                            <div className="w-full space-y-2">
                                                <div className="h-2 bg-gray-300 rounded-full w-3/4 animate-pulse"></div>
                                                <div className="h-2 bg-gray-200 rounded-full w-full animate-pulse" style={{ animationDelay: '0.15s' }}></div>
                                                <div className="h-2 bg-gray-200 rounded-full w-5/6 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                                                <div className="h-2 bg-gray-100 rounded-full w-2/3 animate-pulse" style={{ animationDelay: '0.45s' }}></div>
                                                <div className="mt-3 h-2 bg-gray-300 rounded-full w-3/4 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                                                <div className="h-2 bg-gray-200 rounded-full w-full animate-pulse" style={{ animationDelay: '0.75s' }}></div>
                                                <div className="h-2 bg-gray-200 rounded-full w-4/5 animate-pulse" style={{ animationDelay: '0.9s' }}></div>
                                            </div>
                                            {/* Pen icon writing */}
                                            <div className="absolute bottom-3 right-3 animate-bounce">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fun rotating message */}
                                <p className="text-gray-700 font-semibold text-lg text-center mb-2 transition-all duration-500">
                                    {funMessages[funMessageIndex]}
                                </p>
                                <p className="text-gray-400 text-sm text-center mb-6">
                                    Hang tight! This usually takes about 10 seconds
                                </p>

                                {/* Progress bar */}
                                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-gray-400 via-gray-600 to-gray-800 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${Math.min(progress, 95)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ) : step === 'allComplete' ? (
                            <div className="flex flex-col items-center justify-center h-full p-8">
                                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">All Forms Signed!</h2>
                                <p className="text-gray-500 text-sm">
                                    {totalUnits} Offer to Purchase {totalUnits === 1 ? 'Form has' : 'Forms have'} been signed and uploaded successfully.
                                </p>
                            </div>
                        ) : displayPdfUrl ? (
                            <iframe
                                src={displayPdfUrl}
                                className="w-full h-full border-0"
                                title="OTP Form PDF"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full p-8">
                                <p className="text-gray-400">No PDF to display</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Actions */}
                <div className="w-full md:w-4/12 lg:w-3/12 flex flex-col min-h-0 bg-white">
                    {/* Close button */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">
                            {step === 'generating' && 'Preparing Document'}
                            {step === 'viewing' && 'Document Ready'}
                            {step === 'signing' && 'Sign Document'}
                            {step === 'previewing' && 'Review Signature'}
                            {step === 'processing' && 'Processing'}
                            {step === 'success' && 'Unit Signed'}
                            {step === 'allComplete' && 'All Complete'}
                            {step === 'error' && 'Error'}
                        </h2>
                        {step !== 'processing' && (
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        {/* Generating State */}
                        {step === 'generating' && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                                    <span className="text-4xl animate-bounce">
                                        {['📄', '✍️', '📝', '🪄'][Math.floor(funMessageIndex / 2) % 4]}
                                    </span>
                                </div>
                                <p className="text-gray-800 font-bold text-base mb-1">
                                    {isMultiUnit ? `Preparing Form ${currentUnitIndex + 1} of ${totalUnits}` : 'Preparing Your Form'}
                                </p>
                                {currentUnitName && (
                                    <p className="text-gray-600 text-sm font-medium mb-1">{currentUnitName}</p>
                                )}
                                <p className="text-gray-400 text-xs mt-1 max-w-[200px]">
                                    {funMessages[funMessageIndex]}
                                </p>

                                {/* Mini progress dots */}
                                <div className="flex gap-1.5 mt-5">
                                    <div className="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                </div>
                            </div>
                        )}

                        {/* Viewing State */}
                        {step === 'viewing' && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Document Ready</h3>
                                {currentUnitName && (
                                    <p className="text-gray-700 text-sm font-semibold mb-1">{currentUnitName}</p>
                                )}
                                <p className="text-gray-500 text-sm mb-8 max-w-xs">
                                    Please review the Offer to Purchase Form on the left. When you are ready, click the button below to sign.
                                </p>
                                <button
                                    onClick={() => setStep('signing')}
                                    className="px-8 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    <span>Sign Document</span>
                                </button>
                            </div>
                        )}

                        {/* Signing State */}
                        {step === 'signing' && (
                            <SignaturePad
                                onConfirm={handleSignatureConfirm}
                                onCancel={() => setStep('viewing')}
                                loading={previewLoading}
                            />
                        )}

                        {/* Preview State — review signed PDF before uploading */}
                        {step === 'previewing' && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Review Your Signature</h3>
                                <p className="text-gray-500 text-sm mb-8 max-w-xs">
                                    Check the signed document on the left. Scroll to the bottom of the form to verify your signature is in the correct position. If satisfied, click Proceed to submit.
                                </p>
                                <div className="flex flex-col gap-3 w-full max-w-xs">
                                    <button
                                        onClick={handleProceed}
                                        disabled={signingLoading}
                                        className="w-full px-8 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <span>Proceed</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleRedo}
                                        disabled={signingLoading}
                                        className="w-full px-8 py-3.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Redo Signature</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Processing State */}
                        {step === 'processing' && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Uploading Document</h3>
                                <p className="text-gray-500 text-sm max-w-xs">
                                    Saving your signature and uploading the signed document to Bitrix24...
                                </p>
                            </div>
                        )}

                        {/* Success State (per-unit — shown when more units remain) */}
                        {step === 'success' && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {currentUnitName ? `${currentUnitName} Signed!` : 'Document Signed!'}
                                </h3>
                                <p className="text-gray-500 text-sm mb-2 max-w-xs">
                                    {isMultiUnit
                                        ? `${currentUnitIndex + 1} of ${totalUnits} forms completed. Ready for the next unit.`
                                        : 'The signed Offer to Purchase Form has been saved to the deal.'}
                                </p>
                                {isMultiUnit ? (
                                    <div className="mt-6">
                                        <button
                                            onClick={handleNextUnit}
                                            className="px-8 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                                        >
                                            <span>Next Unit</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={onClose}
                                        className="mt-6 px-8 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                                    >
                                        <span>Done</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* All Complete State (shown after last unit is signed) */}
                        {step === 'allComplete' && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">All Documents Signed!</h3>
                                <p className="text-gray-500 text-sm mb-2 max-w-xs">
                                    {totalUnits} Offer to Purchase {totalUnits === 1 ? 'Form has' : 'Forms have'} been signed and uploaded successfully.
                                </p>
                                <div className="text-xs text-gray-400 space-y-1 mb-8">
                                    <p>Signature saved to client record</p>
                                    <p>All signed PDFs uploaded to deal</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                                >
                                    <span>Done</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Error State */}
                        {step === 'error' && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Something Went Wrong</h3>
                                <p className="text-gray-500 text-sm mb-6 max-w-xs">{errorMessage}</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={generateDocument}
                                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
