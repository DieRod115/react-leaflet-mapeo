
import L from 'leaflet';

const IconLocation = new L.Icon({
    iconUrl: require("../assets/icon.png"),
    iconRetinaUrl: require("../assets/icon.png"),
    iconSize: [40, 40],
    shadowSize: null,
    shadowAnchor: null,
    className: 'leaflet-venue-icon'
});
export default IconLocation
