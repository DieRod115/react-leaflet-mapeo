
import L from 'leaflet';

const UserIcon = new L.Icon({
    iconUrl: require("../assets/uicon.png"),
    iconRetinaUrl: require("../assets/uicon.png"),
    iconSize: [40, 40],
    shadowSize: null,
    shadowAnchor: null,
    className: 'leaflet-venue-icon'
});
export default UserIcon