
import { useRef, useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  ZoomControl,
  GeoJSON,
  LayerGroup,
  Marker,
  Popup,
  Pane,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./MapView.css";
import { useFitBounds } from "./useFitBounds"; // Import the new hook
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";

// Fix Leaflet's default icon issue
//  自訂 icon（展覽 / 課程）+ 修正 Leaflet 預設圖示路徑問題
L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.7.1/dist/images/";

// Custom icons for different types
const exhibitionIcon = L.divIcon({
  className: "custom-marker exhibition-marker",
  html: `<div class="marker-pin exhibition-pin"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const courseIcon = L.divIcon({
  className: "custom-marker course-marker",
  html: `<div class="marker-pin course-pin"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// ------------------------------
//MapView 元件主體：初始 state 與 ref
// ------------------------------
const MapView = ({
  mrtRoutes,
  taipeiDistricts,
  selectedMRT,
  selectedStation,
  selectedDistrict,
  selectedLineStations,
  shortestPaths,
  filteredLocations,
  onRouteClick,
  onStationClick,
  activeFilterType,
  selectedLocationId, //新增從FilterResults.js傳入的selectedLocationId
  onDistrictClick, //新增地圖行政區點擊
  selectedType, // 改成從 `props` 接收 `selectedType`
}) => {
  const mapRef = useRef(null);
  const center = [25.0449, 121.5233]; //善導寺
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [locations, setLocations] = useState([]);

  const [staticData, setStaticData] = useState({
    realLocations: [],
    exhibitions: [],
    courses: [],
  });

  // Track previous values to detect changes
  const prevSelectedMRT = useRef(selectedMRT);
  const prevActiveFilterType = useRef(activeFilterType);
  const prevSelectedStation = useRef(selectedStation);
  const prevSelectedDistrict = useRef(selectedDistrict);


// ------------------------------
// 一次性載入靜態資料/ 存進 staticData   
// 載入成功 / 失敗會 log 出來（debug用）
// ------------------------------
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const base = import.meta.env.BASE_URL; //  自動判斷是 dev 或 build

        const [realLocationsRes, exhibitionsRes, coursesRes] =
          await Promise.all([
            fetch(`${base}map/real_location.json`),
            fetch(`${base}map/exhibition.json`),
            fetch(`${base}map/courses.json`),
          ]);

        const realLocations = await realLocationsRes.json();
        const exhibitions = await exhibitionsRes.json();
        const courses = await coursesRes.json();

        setStaticData({
          realLocations,
          exhibitions,
          courses,
        });

        console.log("[v0] Loaded static data:", {
          realLocations: realLocations.length,
          exhibitions: exhibitions.length,
          courses: courses.length,
        });
      } catch (error) {
        console.error("[v0] Error loading static JSON data:", error);
      }
    };

    loadStaticData();
  }, []);

// ------------------------------
// 偵測篩選條件變動 → 清空地圖上舊有的 marker / popup
// 清空邏輯需放在最上層
//[上層 useEffect]
//└── 清空 locations + 清空 marker/popup DOM
//    ｜
//    ▼
//[中層 useEffect]
//└── 根據 shortestPaths → 建立新 locations
//    ｜
//    ▼
//[下層渲染區]
//└── renderMarkers(renderStations...) → 根據 locations 繪圖
// ------------------------------

  // Clear locations when filter criteria changes
  useEffect(() => {
    const isNewMRT = selectedMRT !== prevSelectedMRT.current;
    const isNewFilterType = activeFilterType !== prevActiveFilterType.current;
    const isNewStation = selectedStation !== prevSelectedStation.current;
    const isNewDistrict = selectedDistrict !== prevSelectedDistrict.current;

    // Clear locations when user changes filter criteria
    if (isNewMRT || isNewFilterType || isNewStation || isNewDistrict) {
      console.log("Filter criteria changed, clearing location markers");
      setLocations([]);

      // Force clear any existing markers
      const markerLayerEl = document.querySelector(".leaflet-marker-pane");
      if (markerLayerEl) {
        while (markerLayerEl.firstChild) {
          markerLayerEl.removeChild(markerLayerEl.firstChild);
        }
      }

      // Also clear popup pane
      const popupLayerEl = document.querySelector(".leaflet-popup-pane");
      if (popupLayerEl) {
        while (popupLayerEl.firstChild) {
          popupLayerEl.removeChild(popupLayerEl.firstChild);
        }
      }
    }

    // Update refs
    prevSelectedMRT.current = selectedMRT;
    prevActiveFilterType.current = activeFilterType;
    prevSelectedStation.current = selectedStation;
    prevSelectedDistrict.current = selectedDistrict;
  }, [selectedMRT, activeFilterType, selectedStation, selectedDistrict]);


  // ------------------------------
//   根據 shortestPaths 產生 locations（selected by mRT）
// - 行政區模式會略過此段
// - 用 end_name (locat_id) 從 staticData.realLocations 篩出場地
// - 再依 selectedType 附上對應的展覽或課程資料
// ------------------------------

  useEffect(() => {
    // Don't fetch if we're in district filter mode
    if (activeFilterType === "district") return;

    if (!shortestPaths?.features?.length || !staticData.realLocations.length)
      return;

    const locatIds = shortestPaths.features.map(
      (path) => path.properties.end_name
    );

    if (locatIds.length === 0) return;

    console.log(
      `[v0] Processing locations for IDs: ${locatIds.join(
        ","
      )}, with type: ${selectedType}`
    );

    // Process static data instead of API call
    const processStaticLocations = () => {
      try {
        // Filter real locations by the location IDs from shortest paths
        const filteredRealLocations = staticData.realLocations.filter((loc) =>
          locatIds.includes(loc.locat_id.toString())
        );

        // Join with exhibitions or courses based on selectedType
        const processedLocations = filteredRealLocations.map((location) => {
          const locationData = {
            ...location,
            exhibitions: [],
            courses: [],
          };

          if (selectedType === "exhibition") {
            // Find exhibitions for this location
            const locationExhibitions = staticData.exhibitions.filter(
              (exhibition) => exhibition.locat_id === location.locat_id
            );
            locationData.exhibitions = locationExhibitions;

            // Set main data from first exhibition if available
            if (locationExhibitions.length > 0) {
              const firstExhibition = locationExhibitions[0];
              locationData.name = firstExhibition.e_name;
              locationData.startdate = firstExhibition.e_startdate;
              locationData.enddate = firstExhibition.e_enddate;
            }
          } else if (selectedType === "courses") {
            // Find courses for this location
            const locationCourses = staticData.courses.filter(
              (course) => course.locat_id === location.locat_id
            );
            locationData.courses = locationCourses;

            // Set main data from first course if available
            if (locationCourses.length > 0) {
              const firstCourse = locationCourses[0];
              locationData.name = firstCourse.c_name;
              locationData.startdate = firstCourse.c_startdate;
              locationData.enddate = firstCourse.c_enddate;
            }
          }

          return locationData;
        });

        console.log("[v0] Processed location data:", processedLocations);

        if (processedLocations.length > 0) {
          setLocations(processedLocations);
        }
      } catch (err) {
        console.error(" Error processing static locations:", err);
      }
    };

    processStaticLocations();
  }, [shortestPaths, selectedType, activeFilterType, staticData]); // Add staticData to dependencies

  // Debug locations
  useEffect(() => {
    console.log("Current locations state:", locations);
    console.log("Current filteredLocations prop:", filteredLocations);
  }, [locations, filteredLocations]);


  // 修改 selectedLocationId 的 useEffect 處理邏輯
// ------------------------------
//    根據 selectedLocationId 聚焦地圖
// - 若為行政區模式 → 從 filteredLocations 找資料
// - 若為捷運模式 → 從 locations 找資料（來自 shortestPaths）
// - 飛到該位置並打開 popup，找不到 marker 時動態建立臨時 marker
// ------------------------------

  useEffect(() => {
    if (!selectedLocationId) return;

    console.log(
      `Selected location ID: ${selectedLocationId}, Type: ${selectedType}, Filter: ${activeFilterType}`
    );

    let location;

      // 根據 activeFilterType 決定從哪裡找資料
    if (activeFilterType === "district") {
      // 對於行政區篩選，只需要比對 locat_id，不需要檢查 type
      location = filteredLocations?.find(
        (loc) => loc.locat_id.toString() === selectedLocationId.toString()
      );
      console.log("Looking in filteredLocations for district:", location);
    } else {

      // 對於捷運篩選，檢查 locat_id 和 type
      location = locations.find(
        (loc) => loc.locat_id.toString() === selectedLocationId.toString()
      );
      console.log("Looking in locations for MRT:", location);
    }

    console.log(" Found location in MapView:", location);

    if (location && mapRef.current) {
      const { latitude, longitude } = location;
      console.log(`📍 Flying to: [${latitude}, ${longitude}]`);

      // 儲存 marker 以便開啟 popup
      let markerToOpen = null;

      // 在 DOM 中尋找對應的 marker
      const markers = document.querySelectorAll(".leaflet-marker-icon");
      markers.forEach((marker) => {
        const markerElement = marker._leaflet_pos;
        if (markerElement) {
          const markerInstance = marker._leaflet_id
            ? Object.values(mapRef.current._layers).find(
                (layer) => layer._leaflet_id === marker._leaflet_id
              )
            : null;

          if (
            markerInstance &&
            markerInstance.options &&
            markerInstance.options.position
          ) {
            const pos = markerInstance.options.position;
            // 比對 marker 的位置是否與目標 location 相符
            if (
              Math.abs(pos[0] - latitude) < 0.0001 &&
              Math.abs(pos[1] - longitude) < 0.0001
            ) {
              markerToOpen = markerInstance;
            }
          }
        }
      });

      // 地圖飛行到該位置
      mapRef.current.flyTo([latitude, longitude], 17, {
        duration: 1.5,
        callback: () => {
          if (markerToOpen && markerToOpen.openPopup) {
            setTimeout(() => {
              markerToOpen.openPopup();
            }, 500);
          }
        },
      });

      // 如果沒有對應的 marker，則創建一個臨時 marker
      if (!markerToOpen) {
        const hasExhibitions =
          location.exhibitions && location.exhibitions.length > 0;
        const hasCourses = location.courses && location.courses.length > 0;

        const icon = hasExhibitions
          ? exhibitionIcon
          : hasCourses
          ? courseIcon
          : L.divIcon({
              className: "custom-marker",
              html: `<div class="marker-pin"></div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 30],
            });

        // 創建臨時 marker 並開啟 popup
        setTimeout(() => {
          const tempMarker = L.marker([latitude, longitude], { icon }).addTo(
            mapRef.current
          );

          // 創建 popup 內容
          const popupContent = document.createElement("div");
          popupContent.className = "popup-content";

          const titleType = document.createElement("h3");
          titleType.className = "popup-title-type";
          titleType.textContent = hasExhibitions
            ? "Exhibition"
            : hasCourses
            ? "Course"
            : "Location";
          popupContent.appendChild(titleType);

          if (location.name) {
            const nameDiv = document.createElement("div");
            nameDiv.className = "popup-name";
            nameDiv.textContent = location.name;
            popupContent.appendChild(nameDiv);
          }

          if (location.startdate && location.enddate) {
            const datesDiv = document.createElement("div");
            datesDiv.className = "popup-dates";
            datesDiv.textContent = `${formatDate(
              location.startdate
            )} - ${formatDate(location.enddate)}`;
            popupContent.appendChild(datesDiv);
          }

          const locationName = document.createElement("div");
          locationName.className = "popup-location-name";
          locationName.textContent = location.locat_name;
          popupContent.appendChild(locationName);

          const address = document.createElement("div");
          address.className = "popup-address";
          address.textContent = location.address;
          popupContent.appendChild(address);

          // 添加展覽資訊
          if (hasExhibitions) {
            const exhibitionsDiv = document.createElement("div");
            exhibitionsDiv.className = "popup-exhibitions";
            const exhibitionsTitle = document.createElement("h4");
            exhibitionsTitle.textContent = "Exhibitions";
            exhibitionsDiv.appendChild(exhibitionsTitle);
            const exhibitionsList = document.createElement("div");
            exhibitionsList.className = "exhibition-list";

            location.exhibitions.forEach((exhibition) => {
              const item = document.createElement("div");
              item.className = "exhibition-item";
              const name = document.createElement("div");
              name.className = "exhibition-name";
              name.textContent = exhibition.e_name || exhibition.name;
              const dates = document.createElement("div");
              dates.className = "exhibition-dates";
              dates.textContent = `${formatDate(
                exhibition.e_startdate || exhibition.startdate
              )} - ${formatDate(exhibition.e_enddate || exhibition.enddate)}`;
              item.appendChild(name);
              item.appendChild(dates);
              exhibitionsList.appendChild(item);
            });

            exhibitionsDiv.appendChild(exhibitionsList);
            popupContent.appendChild(exhibitionsDiv);
          }

          // 添加課程資訊
          if (hasCourses) {
            const coursesDiv = document.createElement("div");
            coursesDiv.className = "popup-courses";
            const coursesTitle = document.createElement("h4");
            coursesTitle.textContent = "Courses";
            coursesDiv.appendChild(coursesTitle);
            const coursesList = document.createElement("div");
            coursesList.className = "course-list";

            location.courses.forEach((course) => {
              const item = document.createElement("div");
              item.className = "course-item";
              const name = document.createElement("div");
              name.className = "course-name";
              name.textContent = course.c_name || course.name;
              const dates = document.createElement("div");
              dates.className = "course-dates";
              dates.textContent = `${formatDate(
                course.c_startdate || course.startdate
              )} - ${formatDate(course.c_enddate || course.enddate)}`;
              item.appendChild(name);
              item.appendChild(dates);
              coursesList.appendChild(item);
            });

            coursesDiv.appendChild(coursesList);
            popupContent.appendChild(coursesDiv);
          }

          tempMarker.bindPopup(popupContent).openPopup();

          // 10 秒後移除臨時標記
          setTimeout(() => {
            mapRef.current.removeLayer(tempMarker);
          }, 10000);
        }, 1600);
      }
    }
  }, [
    selectedLocationId,
    filteredLocations,
    locations,
    selectedType,
    activeFilterType,
  ]); // 監聽 activeFilterType

  // ------------------------------
//  根據目前資料自動縮放地圖視角
// - 自訂 useFitBounds hook
// - 不處理資料，只負責移動畫面位置
// ------------------------------
  // Use the custom fitBounds hook
  useFitBounds({
    mapRef,
    shortestPaths,
    filteredLocations,
    selectedDistrict,
    selectedMRT,
    selectedStation,
    selectedLineStations,
    taipeiDistricts,
    mrtRoutes,
    activeFilterType,
  });


  // ------------------------------
//  樣式與互動控制層
// - 定義 MRT 路線 / 站點 / 行政區 多種狀態樣式
// - styleRoutes 依 hover / select 狀態回傳當前樣式
// - onEachRoute 綁定 hover / click 事件（透過透明 hit 線擴大點擊範圍）
// ------------------------------
  // Base styles
  // 路線基本樣式routeStyle其實用不到可刪
  const routeStyle = {
    color: "#666666",
    weight: 3,
    opacity: 0.8,
  };

  const selectedStyle = {
    color: "#ff0000",
    weight: 5,
    opacity: 1,
  };

  const hoverStyle = {
    color: "#0000ff",
    weight: 5,
    opacity: 1,
  };

  const shortestPathStyle = {
    color: "#00ff00",
    weight: 4,
    opacity: 0.8,
    dashArray: "5, 10", // Dashed line style
  };

  // Format distance helper function
  const formatDistance = (distance) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} km`;
    }
    return `${Math.round(distance)} m`;
  };

  // Add buffer around routes for easier interaction
  const routeBuffer = {
    weight: 30,
    color: "#000",
    opacity: 0,
  };

  const getLineColor = (lineName) => {
    const colorMap = {
      淡水信義線: "#e3002c", // Red
      松山新店線: "#008659", // Green
      中和新蘆線: "#f8b61c", // Orange
      板南線: "#0070bd", // Blue
      文湖線: "#c48c31", // Brown
    };
    return colorMap[lineName] || "#666666";
  };

  // Update station styles
  const stationStyle = {
    radius: 6,
    fillColor: "#ffffff",
    color: selectedMRT ? getLineColor(selectedMRT) : "#000000",
    weight: 2,
    opacity: 1,
    fillOpacity: 1,
  };

  const selectedStationStyle = {
    radius: 10,
    fillColor: getLineColor(selectedMRT) || "#ff7800",
    color: "#000",
    weight: 3,
    opacity: 1,
    fillOpacity: 0.8,
  };

  const hoverStationStyle = {
    radius: 8,
    fillColor: "#ffffff",
    color: getLineColor(selectedMRT) || "#000000",
    weight: 3,
    opacity: 1,
    fillOpacity: 0.9,
  };

  // District selected style (hover)行政區多邊形樣式
  const districtStyle = (feature) => {
    const isSelected = feature.properties.TNAME === selectedDistrict;
    const isHovered = feature.properties.TNAME === hoveredDistrict;

    return {
      color: "#ff7800",
      weight: isSelected || isHovered ? 3 : 1,
      opacity: 0.65,
      fillOpacity: isSelected ? 0.3 : isHovered ? 0.5 : 0.2,
      fillColor: isSelected ? "#ff7800" : "#ffb380",
    };
  };

  // Function to check if a route should be highlighted
  const shouldHighlightRoute = (feature) => {
    if (!selectedMRT || !feature.properties) return false;
    return feature.properties.MRTCODE === selectedMRT;
  };

  const styleRoutes = (feature) => {
    const isHighlighted = shouldHighlightRoute(feature);
    const isHovered = hoveredRoute === feature.properties.MRTCODE;
    const baseColor = getLineColor(feature.properties.MRTCODE);


    if (isHovered) {
      return {
        ...hoverStyle,
        color: getLineColor(feature.properties.MRTCODE),
      };
    }

    if (isHighlighted) {
      return {
        ...selectedStyle,
        color: getLineColor(feature.properties.MRTCODE),
      };
    }

    // return routeStyle;
    //  讓MRT初始就是彩色但是比較淺（Ｅ6是十六進位的透明度90%）
      return {
        ...routeStyle,
        color: baseColor + "E6" , 
      };
  };

  const onEachRoute = (feature, layer) => {
    const addHitArea = () => {
      const hit = L.polyline(layer.getLatLngs(), { ...routeBuffer, interactive: true })
        .addTo(layer._map);
  
      // 讓 hit 區在最上層，容易點到
      hit.bringToFront();
  
      const enter = () => {
        setHoveredRoute(feature.properties.MRTCODE);
        layer.setStyle({ ...hoverStyle, color: getLineColor(feature.properties.MRTCODE) });
      };
      const leave = () => {
        setHoveredRoute(null);
        layer.setStyle(styleRoutes(feature));
      };
      const select = () => {
        onRouteClick(feature.properties.MRTCODE);
      };
  
      // 滑鼠 + 觸控兩種事件
      hit.on({
        mouseover: enter,
        mouseout: leave,
        click: select,
        touchstart: enter,
        touchend: leave,
      });
  
      // 清理
      layer.on("remove", () => {
        if (layer._map) layer._map.removeLayer(hit);
      });
    };
  
    // layer 加到地圖後，才能拿到 layer._map
    if (layer._map) addHitArea();
    else layer.on("add", addHitArea);
  
    layer.bindPopup(feature.properties.MRTCODE);
  };
  

//將目前 selectedLineStations（點選某條捷運線後從父層傳入的站點陣列）轉換成 GeoJSON 格式
//這是之後 renderStations() 傳給 <GeoJSON data={stationGeoJSON}> 用的資料來源
// 依賴條件：
//前提是使用者已點選某條捷運線 → 才會有 selectedLineStations
// 和前面流程關係：
//屬於 選取 MRT 線後才會顯示的衍生資料
//並不是全域 marker（那些是 locations / filteredLocations）
  // Create GeoJSON for stations
  const stationGeoJSON = {
    type: "FeatureCollection",
    features: selectedLineStations.map((station) => ({
      type: "Feature",
      properties: {
        name: station.name_chinese,
        name_english: station.name_english,
        id: station.station_id,
      },
      geometry: {
        type: "Point",
        coordinates: [
          station.coordinates.longitude,
          station.coordinates.latitude,
        ],
      },
    })),
  };

  // Function to check if a station should be highlighted
  const shouldHighlightStation = (stationId) => {
    return selectedStation === stationId;
  };

  // Function to get station style based on selection state
  const getStationStyle = (stationId) => {
    if (shouldHighlightStation(stationId)) {
      return selectedStationStyle;
    }
    return stationStyle;
  };

  const onEachDistrict = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        setHoveredDistrict(feature.properties.TNAME);
        layer.setStyle({
          ...districtStyle(feature),
          fillOpacity: 0.5,
          weight: 3,
        });
      },
      mouseout: (e) => {
        setHoveredDistrict(null);
        layer.setStyle(districtStyle(feature));
      },
      click: (e) => {
        onDistrictClick(feature.properties.TNAME); // 地圖行政區點擊
        console.log("Clicked district:", feature.properties.TNAME);
      },
    });

    // Add popup with district name
    layer.bindPopup(feature.properties.TNAME);
  };

  // Create separate LayerGroups for routes and stations
  //mrtRoutes GeoJSON 畫出台北所有捷運線
  //每條線套用 styleRoutes()（根據 hover/selected 狀態決定顏色與粗細）
  const renderRoutes = () => (
    <Pane name="routes" style={{ zIndex: 400 }}>
      <LayerGroup>
        {mrtRoutes && (
          <GeoJSON
            key={`routes-${selectedMRT || "all"}-${hoveredRoute}`}
            data={mrtRoutes}
            style={styleRoutes}
            onEachFeature={onEachRoute}
          />
        )}
      </LayerGroup>
    </Pane>
  );


// 畫出選中 MRT Line 的所有 Station（放在比 routes 更高的 pane）
const renderStations = () => (
  <Pane name="stations" style={{ zIndex: 500 }}>
    {selectedLineStations && selectedLineStations.length > 0 && (
      <GeoJSON
        pane="stations"   // 讓 GeoJSON 產生的所有子圖層預設都進 stations pane
        key={`stations-${selectedMRT}-${JSON.stringify(selectedLineStations)}`}
        data={stationGeoJSON}
        pointToLayer={(feature, latlng) => {
          // 確保是 CircleMarker（Path 類型），才有 setStyle
          const baseStyle = {
            ...getStationStyle(feature.properties.id),
            radius: (getStationStyle(feature.properties.id).radius ?? 8),
            pane: "stations",
            // 避免點到站時事件冒泡到線（或地圖）造成誤觸
            bubblingMouseEvents: false,
          };

          const marker = L.circleMarker(latlng, baseStyle);

          // 防守：只在仍在地圖上時才 setStyle，避免 unmount 時報錯
          const safeSet = (s) => {
            if (marker && marker.setStyle && marker._map) marker.setStyle(s);
          };

          marker.on({
            mouseover: () => {
              if (!shouldHighlightStation(feature.properties.id)) {
                safeSet({
                  ...hoverStationStyle,
                  radius: hoverStationStyle.radius ?? baseStyle.radius + 2,
                  pane: "stations",
                });
              }
            },
            mouseout: () => {
              if (!shouldHighlightStation(feature.properties.id)) {
                safeSet(baseStyle);
              }
            },
            click: () => {
              // 👉 這裡保持原本流程：選到站 → 交給 onStationClick
              // 你現有的 useFitBounds 會在外面依 selectedStation 反應視角
              onStationClick(feature.properties.id);
            },
          });

          marker.bindPopup(
            `${feature.properties.name}<br>${feature.properties.name_english}`
          );

          return marker;
        }}
      />
    )}
  </Pane>
);

  // Render exhibition/course markers
  const renderLocationMarkers = () => {
    // First check if we should show any markers based on the active filter type
    if (activeFilterType === "mrt" && !shortestPaths?.features?.length) {
      // console.log("Not showing MRT markers - no paths available");
      return null;
    }

    if (activeFilterType === "district" && !filteredLocations?.length) {
      console.log("Not showing district markers - no filtered locations");
      return null;
    }

    // For MRT filter, only use locations from API
    // For district filter, only use filteredLocations
    const locationsToShow =
      activeFilterType === "mrt"
        ? locations
        : activeFilterType === "district"
        ? filteredLocations
        : [];

    if (!locationsToShow.length) {
      console.log("No locations to render markers for");
      return null;
    }

    // console.log(
    //   `Rendering ${locationsToShow.length} markers for ${activeFilterType} filter`
    // );

    return (
      <MarkerClusterGroup
        key={`locations-${activeFilterType}-${locationsToShow.length}-${selectedLocationId}`}
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        polygonOptions={{
          fillColor: "#ff7800",
          color: "#ff7800",
          weight: 0.5,
          opacity: 1,
          fillOpacity: 0.2,
        }}
      >
        {locationsToShow.map((loc, index) => {
          // Added index to map function
          if (loc.latitude && loc.longitude) {
            // Determine if it's an exhibition or course
            const hasExhibitions =
              loc.exhibitions && loc.exhibitions.length > 0;
            const hasCourses = loc.courses && loc.courses.length > 0;

            {/* console.log(
              `Rendering marker for location ${loc.locat_id} at [${loc.latitude}, ${loc.longitude}]`
            ); */}

            return (
              <Marker
                key={`loc-${loc.locat_id}-${activeFilterType}-${index}`} // Updated key to include index
                position={[+loc.latitude, +loc.longitude]}
                icon={
                  hasExhibitions
                    ? exhibitionIcon
                    : hasCourses
                    ? courseIcon
                    : L.divIcon({
                        className: "custom-marker",
                        html: `<div class="marker-pin"></div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 30],
                      })
                }
                eventHandlers={{
                  // Add a click handler to update selectedLocationId
                  click: () => {
                    console.log(`Marker clicked for location: ${loc.locat_id}`);
                  },
                  // Add this to help with finding markers
                  add: (e) => {
                    // Store reference to this marker with its location ID
                    e.target.options.locationId = loc.locat_id;
                    e.target.options.position = [+loc.latitude, +loc.longitude];
                  },
                }}
              >
                <Popup className="location-popup">
                  <div className="popup-content">
                    {/* New structure for popup content */}
                    <h3 className="popup-title-type">
                      {hasExhibitions
                        ? "Exhibition"
                        : hasCourses
                        ? "Course"
                        : "Location"}
                    </h3>

                    {/* Display name if it exists */}
                    {loc.name && <div className="popup-name">{loc.name}</div>}

                    {/* Display dates if they exist */}
                    {loc.startdate && loc.enddate && (
                      <div className="popup-dates">
                        {formatDate(loc.startdate)} - {formatDate(loc.enddate)}
                      </div>
                    )}

                    {/* Display location name */}
                    <div className="popup-location-name">{loc.locat_name}</div>

                    {/* Display address */}
                    <div className="popup-address">{loc.address}</div>

                    {/* Show exhibitions if available */}
                    {hasExhibitions && (
                      <div className="popup-exhibitions">
                        <h4>Exhibitions</h4>
                        <div className="exhibition-list">
                          {loc.exhibitions.map((exhibition, idx) => (
                            <div
                              key={exhibition.e_id || exhibition.id || idx}
                              className="exhibition-item"
                            >
                              <div className="exhibition-name">
                                {exhibition.e_name || exhibition.name}
                              </div>
                              <div className="exhibition-dates">
                                {formatDate(
                                  exhibition.e_startdate || exhibition.startdate
                                )}{" "}
                                -{" "}
                                {formatDate(
                                  exhibition.e_enddate || exhibition.enddate
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show courses if available */}
                    {hasCourses && (
                      <div className="popup-courses">
                        <h4>Courses</h4>
                        <div className="course-list">
                          {loc.courses.map((course, idx) => (
                            <div
                              key={course.c_id || course.id || idx}
                              className="course-item"
                            >
                              <div className="course-name">
                                {course.c_name || course.name}
                              </div>
                              <div className="course-dates">
                                {formatDate(
                                  course.c_startdate || course.startdate
                                )}{" "}
                                -{" "}
                                {formatDate(course.c_enddate || course.enddate)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MarkerClusterGroup>
    );
  };

  // Add renderPathEndMarkers function to display numbered markers at path endpoints
  // This helps with visibility when clicking on path cards
  //在每條最短路徑終點放上編號 marker
  const renderPathEndMarkers = () => {
    if (!shortestPaths?.features?.length) return null;

    // Only show path end markers for MRT filter type
    if (activeFilterType !== "mrt") return null;

    return (
      <LayerGroup>
        {shortestPaths.features.map((path, index) => {
          if (!path.geometry?.coordinates?.[0]?.length) return null;

          const coords = path.geometry.coordinates[0];
          const lastCoord = coords[coords.length - 1];

          if (!lastCoord || lastCoord.length < 2) return null;

          const position = [lastCoord[1], lastCoord[0]];
          const locatId = path.properties.end_name;

          // Find location details if available
          const locationDetails = locations.find(
            (loc) => loc.locat_id.toString() === locatId.toString()
          );

          return (
            <Marker
              key={`path-end-${index}-${locatId}`}
              position={position}
              icon={L.divIcon({
                className: "path-end-marker",
                html: `<div class="path-end-pin">${index + 1}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              <Popup>
                <div>
                  <strong>Location ID:</strong> {locatId}
                  <br />
                  <strong>Distance:</strong>{" "}
                  {formatDistance(path.properties.distance)}
                  {locationDetails && (
                    <>
                      <br />
                      <strong>Name:</strong> {locationDetails.locat_name}
                      <br />
                      <strong>Address:</strong> {locationDetails.address}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </LayerGroup>
    );
  };

  // Render shortest paths only when appropriate
  //畫出捷運站→地點的最短路徑線
  const renderShortestPaths = () => {
    if (!shortestPaths?.features?.length) return null;

    // Only show shortest paths for MRT filter type
    if (activeFilterType !== "mrt") return null;

    return (
      <LayerGroup>
        {shortestPaths.features.map((path, index) => (
          <LayerGroup key={`path-${index}`}>
            <GeoJSON
              data={path}
              style={shortestPathStyle}
              onEachFeature={(feature, layer) => {
                const distance = formatDistance(feature.properties.distance);
                layer.bindPopup(`
                  <div>
                    <strong>End Location:</strong> ${feature.properties.end_name}<br/>
                    <strong>Distance:</strong> ${distance}
                  </div>
                `);
              }}
            />
          </LayerGroup>
        ))}
      </LayerGroup>
    );
  };

  return (
    <div className="map-view">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="map-container"
        zoomControl={false}
        ref={mapRef}
      >
        <ZoomControl position="bottomright" />
        <LayersControl position="topright">
          {/* Base layers */}
          <LayersControl.BaseLayer name="Carto Dark (dimmed)">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains={["a", "b", "c", "d"]}
              maxZoom={19}
              opacity={0.8} //  降低不透明度，視覺會變柔和灰黑
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer checked name="Light">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>

          {/* MRT layers - only visible when activeFilterType is "mrt" */}
          <LayersControl.Overlay
            checked={activeFilterType === "mrt"}
            name="MRT Lines"
          >
            {renderRoutes()}
          </LayersControl.Overlay>

          <LayersControl.Overlay
            checked={activeFilterType === "mrt"}
            name="MRT Stations"
          >
            {renderStations()}
          </LayersControl.Overlay>

          {/* District layer - only visible when activeFilterType is "district" */}
          <LayersControl.Overlay
            checked={activeFilterType === "district"}
            name="Taipei Districts"
          >
            <LayerGroup>
              {taipeiDistricts && (
                <GeoJSON
                  key={`districts-${
                    selectedDistrict || "all"
                  }-${hoveredDistrict}`}
                  data={taipeiDistricts}
                  style={districtStyle}
                  onEachFeature={onEachDistrict}
                />
              )}
            </LayerGroup>
          </LayersControl.Overlay>

          {/* Filtered Locations overlay to match the database fields */}
          <LayersControl.Overlay checked name="Locations">
            {renderLocationMarkers()}
          </LayersControl.Overlay>

          {/* Add the Path Endpoints layer to the LayersControl */}
          <LayersControl.Overlay checked name="Path Endpoints">
            {renderPathEndMarkers()}
          </LayersControl.Overlay>

          {/* Shortest Paths */}
          <LayersControl.Overlay checked name="Shortest Paths">
            {renderShortestPaths()}
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default MapView;
