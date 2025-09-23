

import React, { useState, useEffect } from 'react';
import { Listing } from '../types/index';
import type { SupplierResult } from '../services/suppliers/types';
import { generateComponentImage } from '../services/geminiService';
import { pdfService } from '../services/pdfService';
import VerifiedIcon from '../components/icons/VerifiedIcon';
import { supplierGateway } from '../services';
import { MOCK_LISTINGS, MOCK_PROVENANCE } from '../data/mockMarketplace';

// --- SUB-COMPONENTS ---

const PartCard: React.FC<{ listing: Listing; onSelect: (imageUrl: string | null) => void }> = ({ listing, onSelect }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchImage = async () => {
            setIsLoading(true);
            try {
                const url = await generateComponentImage(`${listing.part.manufacturer} ${listing.part.name}`);
                setImageUrl(url);
            } catch (error) {
                console.error("Failed to generate image for", listing.part.name, error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchImage();
    }, [listing.part.name, listing.part.manufacturer]);

    return (
        <div onClick={() => onSelect(imageUrl)} className="bg-black rounded-lg border border-brand-cyan/30 shadow-lg overflow-hidden cursor-pointer group transition-all hover:border-brand-cyan hover:shadow-glow-cyan">
            <div className="h-48 bg-base-800 flex items-center justify-center overflow-hidden">
                {isLoading && <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 animate-spin border-t-brand-cyan"></div>}
                {imageUrl && <img src={imageUrl} alt={listing.part.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />}
            </div>
            <div className="p-4">
                <p className="text-sm text-gray-400">{listing.part.manufacturer}</p>
                <h3 className="font-semibold text-gray-100 truncate group-hover:text-brand-cyan">{listing.part.name}</h3>
                <div className="flex justify-between items-center mt-3">
                    <p className="font-mono text-xl text-white">${listing.price.toLocaleString()}</p>
                    {listing.isOemVerified && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-700">
                            <VerifiedIcon className="w-4 h-4 mr-1.5" />
                            OEM Verified
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const PartDetailModal: React.FC<{ listing: Listing; onClose: () => void }> = ({ listing, onClose }) => {
    const provenance = MOCK_PROVENANCE[listing.part.id] || [];
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-4xl max-h-[90vh] bg-base-900 rounded-lg border border-brand-cyan shadow-lg flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-brand-cyan/30 flex justify-between items-center">
                    <h2 className="text-xl font-bold font-display text-gray-100">{listing.part.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side: Image & Core Details */}
                    <div>
                        <div className="h-64 bg-base-800 rounded-md mb-4 flex items-center justify-center">
                            {listing.part.imageUrl ? 
                                <img src={listing.part.imageUrl} alt={listing.part.name} className="w-full h-full object-contain" /> :
                                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 animate-spin border-t-brand-cyan"></div>
                            }
                        </div>
                        <div className="space-y-2 text-gray-200">
                             <p><span className="font-semibold text-gray-400">Manufacturer:</span> {listing.part.manufacturer}</p>
                             <p><span className="font-semibold text-gray-400">SKU:</span> {listing.part.sku}</p>
                             <p><span className="font-semibold text-gray-400">Serial:</span> {listing.part.serial}</p>
                             <p><span className="font-semibold text-gray-400">Condition:</span> {listing.condition}</p>
                             <p><span className="font-semibold text-gray-400">Seller:</span> {listing.seller}</p>
                        </div>
                    </div>
                    {/* Right Side: Provenance Timeline */}
                    <div>
                        <h3 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-4 font-display">Provenance Timeline</h3>
                        <div className="relative border-l-2 border-brand-cyan/30 ml-3">
                             {provenance.map(event => (
                                <div key={event.id} className="mb-6 ml-8">
                                    <span className="absolute flex items-center justify-center w-6 h-6 bg-brand-cyan rounded-full -left-3 ring-4 ring-base-900">
                                        <VerifiedIcon className="w-4 h-4 text-black"/>
                                    </span>
                                    <h4 className="font-semibold text-white">{event.type} by {event.actor}</h4>
                                    <p className="text-sm text-gray-500">{event.timestamp}</p>
                                    {event.details && <p className="text-sm text-gray-400 mt-1">{event.details}</p>}
                                    <p className="text-xs font-mono text-brand-cyan/70 mt-1 break-all" title={event.hederaTxId}>Tx: {event.hederaTxId}</p>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
                 <div className="p-4 border-t border-brand-cyan/30 flex justify-end items-center gap-4">
                    <span className="font-mono text-2xl text-white">${listing.price.toLocaleString()}</span>
                    <button 
                        onClick={async () => await pdfService.generateQuote(listing)}
                        className="bg-brand-blue text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600 transition-colors shadow-glow-blue"
                    >
                        Generate Quote
                    </button>
                </div>
            </div>
        </div>
    );
};

const LiveSearchResults: React.FC<{ results: SupplierResult[], isLoading: boolean }> = ({ results, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 animate-spin border-t-brand-cyan"></div>
            </div>
        );
    }

    if (results.length === 0) {
        return <p className="text-gray-500 text-center p-8">No live results found. The CoolDrive iShop page may have opened in a new tab.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-base-700/50">
                <thead className="bg-base-800/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Part</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Supplier</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                    </tr>
                </thead>
                <tbody className="bg-black divide-y divide-base-700/50">
                    {results.map(result => (
                        <tr key={`${result.supplierId}-${result.part.sku}`} className="hover:bg-base-800/40">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-white">{result.part.name}</div>
                                <div className="text-sm text-gray-400">{result.part.manufacturer} ({result.part.sku})</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">{result.supplierId.replace('_', ' ')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">
                                {result.price.amount.toFixed(2)} {result.price.currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {result.availability.inStock ? 
                                    <span className="text-green-400">In Stock ({result.availability.quantity})</span> : 
                                    <span className="text-red-400">Out of Stock</span>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// --- MAIN COMPONENT ---

const Marketplace: React.FC = () => {
    const [selectedPart, setSelectedPart] = useState<Listing | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [liveResults, setLiveResults] = useState<SupplierResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const handleSelectPart = (listing: Listing, imageUrl: string | null) => {
        setSelectedPart({
            ...listing,
            part: { ...listing.part, imageUrl: imageUrl || undefined }
        });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || isSearching) return;
        
        setIsSearching(true);
        setLiveResults([]);
        try {
            // Using NZ as default region
            const results = await supplierGateway.search(searchQuery, { region: 'NZ' });
            setLiveResults(results);
        } catch (error) {
            console.error("Live supplier search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-100 font-display">Parts &amp; Suppliers</h1>
                <p className="text-gray-400 mt-1">Search live supplier inventory or browse DLT-verified parts.</p>
            </div>
            
            {/* Live Supplier Search Section */}
            <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-4 font-display">Live Supplier Search</h2>
                <form onSubmit={handleSearch} className="flex items-center gap-3 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g., Bendix brake pads..."
                        className="flex-1 bg-base-800 border border-base-700 rounded-md px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                        disabled={isSearching}
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="bg-brand-cyan text-black font-semibold px-6 py-2 rounded-md disabled:bg-base-700 disabled:cursor-not-allowed hover:bg-cyan-300 transition-colors shadow-glow-cyan"
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </form>
                <LiveSearchResults results={liveResults} isLoading={isSearching} />
            </div>

             {/* Verified Parts Marketplace Section */}
            <div>
                <h2 className="text-xl font-bold text-gray-100 font-display mb-4">Verified Parts Marketplace</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {MOCK_LISTINGS.map(listing => (
                        <PartCard key={listing.id} listing={listing} onSelect={(imageUrl) => handleSelectPart(listing, imageUrl)} />
                    ))}
                </div>
            </div>

            {selectedPart && <PartDetailModal listing={selectedPart} onClose={() => setSelectedPart(null)} />}
        </div>
    );
};

export default Marketplace;