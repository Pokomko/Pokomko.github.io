const createGroupButton = document.querySelector(".filter__button");
const filterList = document.querySelector(".filter__list");
const powerLineIcon = createPowerLineIcon();
const renderedLines = new Map();
const activeFilters = new Map();

const colorNames = {
    blue: "Синий",
    white: "Белый",
    purple: "Фиолетовый",
    orange: "Оранжевый",
    red: "Красный",
    green: "Зелёный",
    yellow: "Жёлтый",
    brown: "Коричневый"
};

const statusNames = {
    excellent: "Отличное",
    normal: "В пределах нормы",
    needs_attention: "Требуется вмешательство"
}

let lines, map;

function getGroupHTML(color) {
    const russianColor = colorNames[color] || color;

    return `
    <div class="group">
      <div class="group__headline">
          <h3 class="group__title">${russianColor}</h3>
          <button class="group__apply-btn">Применить</button>
      </div>
      <div class="group__filter dropdown-container">
          <fieldset class="filter-group__section">
              <legend>Напряжение</legend>
              <label><input type="checkbox" name="voltage" value="100"> 100 В</label>
              <label><input type="checkbox" name="voltage" value="200" checked> 200 В</label>
              <label><input type="checkbox" name="voltage" value="300"> 300 В</label>
          </fieldset>

          <fieldset class="filter-group__section">
              <legend>Техническое состояние</legend>
              <label><input type="radio" name="status-${color}" value="excellent"> Отличное</label>
              <label><input type="radio" name="status-${color}" value="normal" checked> В пределах нормы</label>
              <label><input type="radio" name="status-${color}" value="needs_attention"> Требуется вмешательство</label>
          </fieldset>

          <fieldset class="filter-group__section">
              <legend>Дата последнего обслуживания</legend>
              <div class="date-input">
                  <input type="date" placeholder="Дата от">
                  <input type="date" placeholder="Дата до">
              </div>
          </fieldset>

          <div class="buttons">
              <button>Последние полгода</button>
              <button>Последний год</button>
              <button>Последние 2 года</button>
          </div>
      </div>
  </div>
  `
}

createGroupButton.addEventListener("click", function () {
    const selectedColor = colorSelector.value;
    const selectedOption = colorSelector.querySelector(`option[value="${selectedColor}"]`);
    const selector = document.getElementById("colorSelector");

    if (selectedOption == null) {
        selector.style.visibility = "hidden";
        alert("Все доступные цвета уже использованы.");
        return;
    }

    selectedOption.remove();

    if (selector.options.length === 0) {
        selector.style.visibility = "hidden";
    }

    // 👇 Добавляем CSS-стиль с псевдоэлементом
    const pseudoClass = `pseudo-${selectedColor}`;
    const styleId = `style-${selectedColor}`;

    if (!document.getElementById(styleId)) {
        const styleTag = document.createElement("style");
        styleTag.id = styleId;
        styleTag.innerHTML = `
        .${pseudoClass}::before {
          content: '';
          display: inline-block;
          width: 13px;
          height: 13px;
          margin-right: 6px;
          background-color: ${selectedColor};
          border-radius: 2px;
          border: solid black 1px;
        }
      `;
        document.head.appendChild(styleTag);
    }

    // 👇 Передаём цвет в разметку группы
    const groupHTML = getGroupHTML(selectedColor, pseudoClass);
    filterList.insertAdjacentHTML("beforeend", groupHTML);

    const lastGroup = filterList.querySelector(".group:last-child");
    const applyBtn = lastGroup.querySelector(".group__apply-btn");

    applyBtn.addEventListener("click", function (event) {
        if (event.target.classList.contains("group__apply-btn")) {
            const group = event.target.closest(".group");
    
            const voltageInputs = group.querySelectorAll('input[name="voltage"]:checked');
            const selectedVoltages = Array.from(voltageInputs).map(input => input.value);
    
            const statusInput = group.querySelector(`input[name="status-${selectedColor}"]:checked`);
            const selectedStatus = statusInput ? statusInput.value : null;
    
            // Сохраняем активный фильтр
            activeFilters.set(selectedColor, {
                voltages: selectedVoltages,
                statuses: [selectedStatus]
            });
    
            // Перерисовываем всё по всем фильтрам
            reDrawAllFiltered();

            const legend = document.querySelector(".legend");

            const existingLegendItem = legend.querySelector(`.legend-item.pseudo-${selectedColor}`);
            const russianSelectedColor = colorNames[selectedColor] || selectedColor;
            const russianSelectedStatus = statusNames[selectedStatus] || selectedStatus;

            const newLegendItemHtml = `
          <span class="legend__color">${russianSelectedColor}</span><br>
          <span><b>Вольтаж:</b> ${selectedVoltages}</span>,<br> 
          <span><b>Статус:</b> ${russianSelectedStatus}</span>
        `;

            if (existingLegendItem) {
                existingLegendItem.innerHTML = newLegendItemHtml;
            } else {
                const legendItem = document.createElement("div");
                legendItem.classList.add("legend-item", `pseudo-${selectedColor}`);
                legendItem.innerHTML = newLegendItemHtml;
                legend.appendChild(legendItem);
            }
        }
    });

    const dropdowns = filterList.querySelectorAll(".group__headline");

    dropdowns.forEach(dropdown => {
        if (!dropdown.dataset.listenerAttached) {
            dropdown.addEventListener("click", clickOnGroup);
            dropdown.dataset.listenerAttached = "true";
        }
    });
});

function clickOnGroup(event) {
    const headline = event.currentTarget;
    const content = headline.nextElementSibling;

    headline.classList.toggle("active");
    content.classList.toggle("open");
}


function renderPowerLine(line, icon, map) {
    const { coordinates, color, id, voltage, status } = line;

    // Удаляем предыдущие слои этой линии, если они есть
    if (renderedLines.has(id)) {
        renderedLines.get(id).forEach(layer => map.removeLayer(layer));
    }

    const layers = [];

    const polyline = L.polyline(coordinates, {
        color: color || 'black',
        weight: 4
    }).addTo(map);
    layers.push(polyline);

    coordinates.forEach(coords => {
        const marker = L.marker(coords, { icon })
            .addTo(map)
            .bindPopup(`<b>
                Линия #${id}</b><br>
                Напряжение: ${voltage}<br>
                Статус: ${statusNames[status]}<br>
                <button class="request-btn" data-id="${id}">Оставить заявку</button>
                `);
        layers.push(marker);
    });

    renderedLines.set(id, layers);
}

function createPowerLineIcon() {
    return L.icon({
        iconUrl: 'img/powerLine.png',
        iconSize: [40, 35], // size of the icon
        iconAnchor: [20, 35], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
}

function reDrawAllFiltered() {
    lines.forEach(line => {
        let matchedColor = null;

        for (let [color, filter] of activeFilters.entries()) {
            const matchesVoltage = filter.voltages.includes(String(line.voltage));
            const matchesStatus = filter.statuses.includes(line.status);

            if (matchesVoltage && matchesStatus) {
                matchedColor = color;
                break; // можно поменять на "continue", если хочешь последний фильтр в приоритете
            }
        }

        line.color = matchedColor || 'black';
        renderPowerLine(line, powerLineIcon, map);
    });
}

// Ждём загрузки документа
document.addEventListener("DOMContentLoaded", function () {
    map = L.map('map').setView([51.505, -0.09], 13);

    // Подключаем тайлы карты (если используете локальные, замените URL)
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    lines = [
        {
            "id": 1,
            "voltage": 100,
            "coordinates": [
                [53.9006, 27.5593],
                [53.9053, 27.5538],
                [53.9091, 27.5580],
                [53.9151, 27.5524],
                [53.9174, 27.5529],
                [53.9251, 27.5450],
            ],
            "status": "excellent"
        },
        {
            "id": 2,
            "voltage": 100,
            "coordinates": [
                [53.8806, 27.5593],
                [53.8853, 27.5538],
                [53.8891, 27.5580],
                [53.8951, 27.5524],
                [53.8974, 27.5529],
                [53.9051, 27.5450],
            ],
            "status": "normal"
        },
        {
            "id": 3,
            "voltage": 300,
            "coordinates": [
                [53.9100, 27.5600],
                [53.9120, 27.5650],
                [53.9160, 27.5700],
                [53.9200, 27.5750]
            ],
            "status": "needs_attention"
        },
        {
            "id": 4,
            "voltage": 200,
            "coordinates": [
                [53.9300, 27.5800],
                [53.9350, 27.5850],
                [53.9400, 27.5900],
                [53.9450, 27.5950],
                [53.9500, 27.6000]
            ],
            "status": "normal"
        },
        {
            "id": 5,
            "voltage": 300,
            "coordinates": [
                [53.8600, 27.5100],
                [53.8650, 27.5150],
                [53.8700, 27.5200],
                [53.8750, 27.5250],
                [53.8800, 27.5300]
            ],
            "status": "excellent"
        }
    ]

    lines.forEach(line => renderPowerLine(line, powerLineIcon, map));

    // Подгоняем карту под охват всех точек
    const allCoords = lines.flatMap(line => line.coordinates);
    if (allCoords.length > 0) {
        map.fitBounds(allCoords);
    }
});