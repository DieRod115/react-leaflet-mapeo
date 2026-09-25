import { useEffect} from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const heatPoints = points.map((p) => [p.lat, p.lng, 1.0]);
        const heatLayer = L.heatLayer(heatPoints, { 
            radius: 25,
            blur: 20,
            maxZoom: 17,
            max: 1.0,
            minOpacity: 0.5,
            gradient: { 0.4: 'blue', 0.65: 'cyan',0.7: 'lime', 0.8: 'yellow', 1: 'red' 
            },
        });
        heatLayer.addTo(map);
        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);
    };
    export default HeatmapLayer;