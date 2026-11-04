
import L from 'leaflet';

const MarkerIcon = new L.Icon({
    iconUrl: require("../assets/micon.png"),
    iconRetinaUrl: require("../assets/micon.png"),
    iconSize: [40, 40],
    shadowSize: null,
    shadowAnchor: null,
    className: 'leaflet-venue-icon'
});
export default MarkerIcon