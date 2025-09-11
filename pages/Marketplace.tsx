
import React, { useState, useEffect } from 'react';
import { Listing, PartCategory, PartCondition, ProvenanceEvent, ProvenanceEventType } from '../types';
import { generateComponentImage } from '../services/geminiService';
import VerifiedIcon from '../components/icons/VerifiedIcon';

// --- MOCK DATA BASED ON USER SPEC ---
const MOCK_LISTINGS: Listing[] = [
    {
        id: '1',
        part: { id: 'p1', manufacturer: 'Brembo', sku: 'BRE-GT8-380', serial: 'SN789-001', category: PartCategory.Brakes, name: 'GT8 8-Piston Big Brake Kit', description: 'High-performance braking system for track and street use.' },
        price: 3200, currency: 'USD', condition: PartCondition.New, seller: 'KC Speed Shop', isOemVerified: true,
    },
    {
        id: '2',
        part: { id: 'p2', manufacturer: 'Garrett', sku: 'GAR-GTX3582R', serial: 'SN123-005', category: PartCategory.ForcedInduction, name: 'GTX3582R Gen II Turbocharger', description: 'Competition-grade turbocharger with a 66mm compressor wheel.' },
        price: 2500, currency: 'USD', condition: PartCondition.New, seller: 'Tuner Imports', isOemVerified: true,
    },
    {
        id: '3',
        part: { id: 'p3', manufacturer: 'Ohlins', sku: 'OHL-R&T-SUB-WRX', serial: 'SN456-012', category: PartCategory.Suspension, name: 'Road & Track Coilovers', description: 'Dual Flow Valve (DFV) technology for superior handling.' },
        price: 2850, currency: 'USD', condition: PartCondition.UsedLikeNew, seller: 'Private Seller', isOemVerified: false,
    },
     {
        id: '4',
        part: { id: 'p4', manufacturer: 'AEM', sku: 'AEM-30-0300', serial: 'SN555-101', category: PartCategory.Electronics, name: 'X-Series Wideband UEGO Controller Gauge', description: 'Essential for accurate air/fuel ratio monitoring during tuning.' },
        price: 180, currency: 'USD', condition: PartCondition.New, seller: 'KC Speed Shop', isOemVerified: true,
    },
    {
        id: '5',
        part: { id: 'p5', manufacturer: 'Tomei', sku: 'TOM-EXPREME-Ti', serial: 'SN222-045', category: PartCategory.Exhaust, name: 'Expreme Ti Titanium Catback Exhaust', description: 'Extremely lightweight full titanium exhaust system for maximum performance.' },
        price: 1100, currency: 'USD', condition: PartCondition.UsedGood, seller: 'TrackDayParts', isOemVerified: false,
    },
    {
        id: '6',
        part: { id: 'p6', manufacturer: 'IAG', sku: 'IAG-ENG-2500', serial: 'SN333-098', category: PartCategory.Engine, name: 'Stage 2.5 Closed Deck Short Block', description: 'Built to handle up to 800 BHP for Subaru WRX/STI.' },
        price: 5500, currency: 'USD', condition: PartCondition.New, seller: 'KC Speed Shop', isOemVerified: true,
    }
];

const MOCK_PROVENANCE: { [key: string]: ProvenanceEvent[] } = {
    'p1': [
        { id: 'prov1-1', type: ProvenanceEventType.Minted, actor: 'Brembo S.p.A.', timestamp: '2024-05-10 09:00 UTC', hederaTxId: '0.0.123@1658498112.123456789' },
        { id: 'prov1-2', type: ProvenanceEventType.Listed, actor: 'KC Speed Shop', timestamp: '2024-07-20 14:00 UTC', hederaTxId: '0.0.123@1658498112.234567890' },
    ],
    'p2': [
        { id: 'prov2-1', type: ProvenanceEventType.Minted, actor: 'Garrett Motion Inc.', timestamp: '2024-04-01 11:00 UTC', hederaTxId: '0.0.123@1658498112.345678901' },
        { id: 'prov2-2', type: ProvenanceEventType.Listed, actor: 'Tuner Imports', timestamp: '2024-07-18 10:00 UTC', hederaTxId: '0.0.123@1658498112.456789012' },
    ],
    'p3': [
        { id: 'prov3-1', type: ProvenanceEventType.Minted, actor: 'Öhlins Racing AB', timestamp: '2023-11-20 12:00 UTC', hederaTxId: '0.0.123@1658498112.567890123' },
        { id: 'prov3-2', type: ProvenanceEventType.Sold, actor: 'Original Buyer', timestamp: '2024-01-15 18:00 UTC', hederaTxId: '0.0.123@1658498112.678901234' },
        { id: 'prov3-3', type: ProvenanceEventType.Installed, actor: 'KC Speed Shop', timestamp: '2024-01-20 16:00 UTC', hederaTxId: '0.0.123@1658498112.789012345', details: 'Installed on Subaru WRX VIN: ...' },
        { id: 'prov3-4', type: ProvenanceEventType.Listed, actor: 'Private Seller', timestamp: '2024-07-21 09:00 UTC', hederaTxId: '0.0.123@1658498112.890123456' },
    ],
    'p4': [
        { id: 'prov4-1', type: ProvenanceEventType.Minted, actor: 'AEM Performance Electronics', timestamp: '2024-06-01 08:00 UTC', hederaTxId: '0.0.123@1658498112.901234567' },
        { id: 'prov4-2', type: ProvenanceEventType.Listed, actor: 'KC Speed Shop', timestamp: '2024-07-22 11:00 UTC', hederaTxId: '0.0.123@1658498112.012345678' },
    ],
     'p5': [
        { id: 'prov5-1', type: ProvenanceEventType.Minted, actor: 'Tomei Powered Inc.', timestamp: '2023-09-01 08:00 UTC', hederaTxId: '0.0.123@1658498112.112345678' },
        { id: 'prov5-2', type: ProvenanceEventType.Listed, actor: 'TrackDayParts', timestamp: '2024-07-15 10:00 UTC', hederaTxId: '0.0.123@1658498112.223456789' },
    ],
     'p6': [
        { id: 'prov6-1', type: ProvenanceEventType.Minted, actor: 'IAG Performance', timestamp: '2024-07-01 08:00 UTC', hederaTxId: '0.0.123@1658498112.334567890' },
        { id: 'prov6-2', type: ProvenanceEventType.Listed, actor: 'KC Speed Shop', timestamp: '2024-07-10 12:00 UTC', hederaTxId: '0.0.123@1658498112.445678901' },
    ],
};

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
                    <button className="bg-brand-blue text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600 transition-colors shadow-glow-blue">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const Marketplace: React.FC = () => {
    const [selectedPart, setSelectedPart] = useState<Listing | null>(null);
    
    const handleSelectPart = (listing: Listing, imageUrl: string | null) => {
        setSelectedPart({
            ...listing,
            part: { ...listing.part, imageUrl: imageUrl || undefined }
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-100 font-display">Verified Parts Marketplace</h1>
                <p className="text-gray-400 mt-1">Authentic performance parts with an immutable history on Hedera.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {MOCK_LISTINGS.map(listing => (
                    <PartCard key={listing.id} listing={listing} onSelect={(imageUrl) => handleSelectPart(listing, imageUrl)} />
                ))}
            </div>

            {selectedPart && <PartDetailModal listing={selectedPart} onClose={() => setSelectedPart(null)} />}
        </div>
    );
};

export default Marketplace;
