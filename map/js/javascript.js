var dropdown = document.getElementsByClassName("group__headline");
var i;

for (i = 0; i < dropdown.length; i++) {
  dropdown[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var dropdownContent = this.nextElementSibling;
    if (dropdownContent.style.display === "block") {
      dropdownContent.style.display = "none";
    } else {
      dropdownContent.style.display = "block";
    }
  });
}

// Ждём загрузки документа
document.addEventListener("DOMContentLoaded", function () {
    var map = L.map('map').setView([51.505, -0.09], 13);

    // Подключаем тайлы карты (если используете локальные, замените URL)
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var markers = [
        [55.751244, 37.618423], // Москва
        [55.755826, 37.617299], // Кремль
        [55.760186, 37.618711]  // Арбат
    ];

    var powerLineIcon = L.icon({
        iconUrl: 'img/powerLine.png',
    
        iconSize:     [40, 35], // size of the icon
        iconAnchor:   [20, 35], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    // Создаём массив точек для линии
    var latlngs = [];

    // Добавляем маркеры на карту
    markers.forEach(coords => {
        L.marker(coords, {icon: powerLineIcon}).addTo(map);
        latlngs.push(coords);
    });

    // Создаём линию между маркерами
    L.polyline(latlngs, { color: 'red' }).addTo(map);

    map.fitBounds(latlngs);
});
