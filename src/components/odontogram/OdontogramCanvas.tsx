import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import type { Stroke } from '../../types/odontogram';

interface OdontogramaCanvasProps {
  dienteId: string | null; 
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  tool: 'pen' | 'eraser';
  strokeWidth: number;
  strokeColor: string;
  zoom: number;
}

export const OdontogramaCanvas = forwardRef<any, OdontogramaCanvasProps>(({
  dienteId,
  strokes,
  setStrokes,
  tool,
  strokeWidth,
  strokeColor,
  zoom,
}, ref) => {
  const isDrawing = useRef<boolean>(false);
  const stageRef = useRef<any>(null);
  
  const [imagePath, setImagePath] = React.useState<string>('/odontograma.png'); 
  const [backgroundImage] = useImage(imagePath, 'anonymous');

  const canvasWidth = 1100;
  const canvasHeight = 450;

  useImperativeHandle(ref, () => ({
    obtenerSnapshot: () => {
      if (stageRef.current) {
        return stageRef.current.toDataURL({ pixelRatio: 2 }); 
      }
      return null;
    }
  }));

  useEffect(() => {
    if (dienteId && dienteId !== 'maestro_global') {
      const nombreArchivoLimpio = dienteId
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/-+/g, '_');
      
      setImagePath(`/assets/dientes/${nombreArchivoLimpio}.png`);
    } else {
      setImagePath('/odontograma.png'); 
    }
  }, [dienteId]);

  const handleMouseDown = () => {
    const stage = stageRef.current;
    if (!stage) return;
    isDrawing.current = true;
    
    const pos = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const relativePos = transform.point(pos);

    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      tool,
      strokeWidth: tool === 'eraser' ? 25 : strokeWidth,
      color: strokeColor,
      points: [relativePos.x, relativePos.y],
    };
    setStrokes([...strokes, newStroke]);
  };

  const handleMouseMove = () => {
    if (!isDrawing.current) return;
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const relativePos = transform.point(pos);

    if (strokes.length === 0) return;
    const lastStroke = { ...strokes[strokes.length - 1] };
    lastStroke.points = lastStroke.points.concat([relativePos.x, relativePos.y]);

    setStrokes(strokes.slice(0, -1).concat(lastStroke));
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div className="overflow-auto bg-slate-950 p-2 rounded-xl border border-slate-800 w-full flex justify-center">
      <div style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }} className="transition-all duration-200">
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="bg-[#f8f9fa] rounded-lg shadow-inner cursor-crosshair"
        >
          <Layer>
            {backgroundImage ? (() => {
              const escalaWidth = canvasWidth / backgroundImage.width;
              const escalaHeight = canvasHeight / backgroundImage.height;
              const escala = Math.min(escalaWidth, escalaHeight);

              const anchoProporcional = backgroundImage.width * escala;
              const altoProporcional = backgroundImage.height * escala;

              const centroX = (canvasWidth - anchoProporcional) / 2;
              const centroY = (canvasHeight - altoProporcional) / 2;

              return (
                <KonvaImage 
                  image={backgroundImage} 
                  x={centroX}
                  y={centroY}
                  width={anchoProporcional} 
                  height={altoProporcional} 
                  listening={false} 
                />
              );
            })() : null}
          </Layer>
          
          <Layer>
            {strokes.map((stroke) => (
              <Line
                key={stroke.id}
                points={stroke.points}
                stroke={stroke.color}
                strokeWidth={stroke.strokeWidth}
                tension={0.4}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={stroke.tool === 'eraser' ? 'destination-out' : 'source-over'}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
});

OdontogramaCanvas.displayName = 'OdontogramaCanvas';