import React from 'react';

const EngineDiagram: React.FC = () => {
  const modelUrl = "https://sketchfab.com/models/7ebc9741434540c4831453066d7ae057/embed?autospin=0.5&autostart=1&preload=1&ui_theme=dark&ui_controls=1&ui_infos=0&ui_help=0&ui_settings=0&ui_vr=0&ui_annotations=0&ui_hint=2";

  return (
    <div className="w-full max-w-3xl aspect-video relative engine-3d-container">
      <iframe
        title="Toyota 2JZ GTE Engine 3D Model"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; xr-spatial-tracking"
        src={modelUrl}
        className="w-full h-full"
      >
      </iframe>
      <div className="absolute bottom-1 right-2 text-xs text-gray-600 bg-black/50 px-2 py-1 rounded pointer-events-none">
         Model by autoNgraphic
      </div>
    </div>
  );
};

export default EngineDiagram;