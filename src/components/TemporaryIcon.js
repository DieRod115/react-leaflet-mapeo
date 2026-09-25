
import L from 'leaflet';

const TemporaryIcon = new L.Icon({
    iconUrl: require("../assets/ticon.png"),
    iconRetinaUrl: require("../assets/ticon.png"),
    iconSize: [40, 40],
    shadowSize: null,
    shadowAnchor: null,
    className: 'leaflet-venue-icon'
});
export default TemporaryIcon