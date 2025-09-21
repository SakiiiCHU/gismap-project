
import { useState, useEffect, useMemo, useCallback } from "react";
import FilterPanel from "./_components/FilterPanel";
import "./map.css";
import FilterResults from "./_components/FilterResults";
import MapView from "./_components/MapView";
import { fetchLocationsByDistrict } from "../utils/staticDataLoader";

export default function Page() {
  const [selectedMRT, setSelectedMRT] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedLineStations, setSelectedLineStations] = useState([]);
  const [mapData, setMapData] = useState({
    mrtRoutes: null,
    taipeiDistricts: null,
    shortestPaths: null,
  });
  const [metroData, setMetroData] = useState({ mrt_lines: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredPaths, setFilteredPaths] = useState(null);

  // Add these new state variables
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [activeFilterType, setActiveFilterType] = useState("mrt"); // "mrt" or "district"
  // Add a new state for filtered locations
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null); //新增管理地圖選取地點的狀態

  const [activeDataType, setActiveDataType] = useState("courses"); //新增管理展覽或課程的篩選器選擇

  const [clickedStationLocations, setClickedStationLocations] = useState([]); //捷運站選取後跟後端資料

  const handleClearAll = () => {
    setSelectedMRT("");
    setSelectedStation("");
    setSelectedDistrict("");
    setActiveFilterType("mrt"); // FilterPanel 的clear all按鈕清空邏輯
  };

  //避免離開地圖網頁時scroll bar 失效
  useEffect(() => {
    const updateOverflow = () => {
      if (window.innerWidth > 768) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
    };

    // Initial call
    updateOverflow();

    // Update on resize
    window.addEventListener("resize", updateOverflow);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("resize", updateOverflow);
    };
  }, []);

  // Load map data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const base = import.meta.env.BASE_URL; // 自動偵測是本機還是 GitHub Pages

        setIsLoading(true);
        const [routesRes, lineStationsRes, shortestPathsRes, districtsRes] =
          await Promise.all([
            fetch(`${base}map/TPE_MRT_ROUTE_4326.geojson`),
            fetch(`${base}map/TPE_metroLineStation.json`),
            fetch(`${base}map/shortestPath_wgs84.geojson`),
            fetch(`${base}map/TPE_Dist_4326.geojson`),
          ]);

        const routesData = await routesRes.json();
        const metroLineData = await lineStationsRes.json();
        const shortestPathsData = await shortestPathsRes.json();
        const districtsData = await districtsRes.json();

        setMapData((prev) => ({
          ...prev,
          mrtRoutes: routesData,
          shortestPaths: shortestPathsData,
          taipeiDistricts: districtsData,
        }));
        setMetroData(metroLineData);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load map data");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update stations when line changes
  useEffect(() => {
    // console.log("🔄 Updating stations for line:", selectedMRT);

    if (selectedMRT && metroData.mrt_lines) {
      const selectedLine = metroData.mrt_lines.find(
        (line) => line.line === selectedMRT
      );
      if (selectedLine) {
        // console.log("✅ Found line:", selectedLine.line);
        // console.log("📍 Station count:", selectedLine.stations.length);
        setSelectedLineStations([]);
        setTimeout(() => {
          setSelectedLineStations(selectedLine.stations);
        }, 0);
      } else {
        // console.log("❌ No matching line found for:", selectedMRT);
        setSelectedLineStations([]);
      }
    } else {
      // console.log("⚪ Clearing stations - no line selected");
      // setSelectedLineStations([]);
    }
    setSelectedStation("");
    // Clear filtered paths when changing lines
    setFilteredPaths(null);
  }, [selectedMRT, metroData.mrt_lines]);

  const handleLineSelect = useCallback(
    (e) => {
      const value = e?.target?.value ?? e;
      console.log("🚇 Line select value:", value);

      if (value === "all") {
        console.log("🔄 Clearing selection");
        setSelectedMRT("");
        setSelectedStation("");
        setSelectedLineStations([]);
        setFilteredPaths(null);
        return;
      }

      const lineInMetroData = metroData.mrt_lines?.find(
        (line) => line.line === value
      );
      const lineInRoutes = mapData.mrtRoutes?.features.find(
        (feature) => feature.properties.MRTCODE === value
      );

      console.log("Line exists in metro data:", !!lineInMetroData);
      console.log("Line exists in routes:", !!lineInRoutes);

      if (lineInMetroData && lineInRoutes) {
        setSelectedMRT(value);
        const event = new CustomEvent("metroLineSelected", { detail: value });
        window.dispatchEvent(event);
      } else {
        console.error("❌ Line not found in one or both data sources:", value);
      }
    },
    [metroData.mrt_lines, mapData.mrtRoutes]
  );

  const handleStationSelect = useCallback(
    (stationId) => {
      console.log("🚉 Station select:", stationId);
      const newValue = stationId === "all" ? "" : stationId;
      setSelectedStation(newValue);
      // Clear filtered paths when changing stations
      setFilteredPaths(null);

      if (newValue && metroData.mrt_lines) {
        const line = metroData.mrt_lines.find((line) =>
          line.stations.some((station) => station.station_id === newValue)
        );
        if (line && line.line !== selectedMRT) {
          handleLineSelect(line.line);
        }
      }
    },
    [metroData.mrt_lines, selectedMRT, handleLineSelect]
  );

  // Handle map route click
  const handleRouteClick = useCallback(
    (mrtCode) => {
      console.log("🗺️ Map route clicked:", mrtCode);
      const lineExists = metroData.mrt_lines?.some(
        (line) => line.line === mrtCode
      );
      if (lineExists) {
        handleLineSelect(mrtCode);
      } else {
        console.error("❌ Clicked route not found in metro data:", mrtCode);
      }
    },
    [metroData.mrt_lines, handleLineSelect]
  );

  // Handle map station click
  const handleStationClick = useCallback(
    (stationId) => {
      console.log("🗺️ Map station clicked:", stationId);
      setClickedStationLocations([]); // ✅ 清空舊的捷運站 pin
      handleStationSelect(stationId);
    },
    [handleStationSelect]
  );

  // Handle district click
  // --- handlers ---
  // --- handlers ---
  // 點擊地圖上的行政區時
  const handleDistrictClick = (districtName) => {
    console.log("✅ 點擊行政區:", districtName);
    setSelectedDistrict(districtName);

    //  清空捷運篩選相關，避免混用
    setSelectedMRT("");
    setSelectedStation("");
    setSelectedLineStations([]);
    setFilteredPaths(null);
    setFilteredLocations([]); // ✅ 清空舊的 pin 結果
  };

  // 切換展覽/課程時
  const handleDataTypeChange = useCallback((selectedType) => {
    setActiveDataType(selectedType);
    setSelectedDistrict("");
    setSelectedMRT("");
    setSelectedStation("");
    setSelectedLineStations([]);
    setFilteredLocations([]);
    setFilteredPaths(null);
  }, []);

  //清空FilterResults跟後端的pin
  const handleSelectLocation = (location) => {
    setClickedStationLocations([location]);
  };

  // Add new handler for district selection
  const handleDistrictSelect = useCallback(
    (districtName) => {
      console.log("🏙️ District selected:", districtName);
      const newValue = districtName === "all" ? "" : districtName;

      setSelectedDistrict(newValue);
      setFilteredLocations([]); // ✅ 這行清空上一次篩選結果
      setFilteredPaths(null); // ✅ 也清空捷運的篩選結果
      setSelectedMRT(""); // ✅ 清空捷運線
      setSelectedStation(""); // ✅ 清空捷運站
      setSelectedLineStations([]);

      if (newValue && mapData.taipeiDistricts?.features) {
        console.log(`📍 FitBounds will be applied for district: ${newValue}`);
      }
    },
    [mapData.taipeiDistricts]
  );

  //**Static data fetch在這～**/
  //使用者按下 FilterPanel 裡面的 Apply Filter 按鈕後才執行static data fetch
  // Modify handleApplyFilter to handle both MRT and district filtering
  const handleApplyFilter = useCallback(async () => {
    setClickedStationLocations([]);

    // 確保先選擇了展覽或課程類型
    if (!activeDataType) {
      alert("請先選擇:展覽/課程");
      return;
    }

    // 如果是 MRT 篩選
    if (activeFilterType === "mrt") {
      console.log("🎯 Applying MRT filter for station:", selectedStation);

      if (!selectedStation || !mapData.shortestPaths) {
        console.log("❌ No station selected or no path data available");
        return;
      }

      setIsLoading(true);

      try {
        const station = selectedLineStations.find(
          (s) => s.station_id === selectedStation
        );
        if (!station) {
          console.error("❌ Selected station not found in line stations");
          return;
        }

        const stationName = `${station.name_chinese}`;
        console.log("🔍 Searching for paths from:", stationName);

        // 篩選出來的路徑
        const paths = mapData.shortestPaths.features.filter(
          (feature) => feature.properties.start_name === stationName
        );

        console.log(`✅ Found ${paths.length} paths from ${stationName}`);
        setFilteredPaths({
          type: "FeatureCollection",
          features: paths,
        });
        setFilteredLocations([]); // 清空地點資料
      } catch (err) {
        console.error("Error filtering paths:", err);
        setError("Failed to filter paths");
      } finally {
        setIsLoading(false);
      }
    } else {
      // 如果是行政區篩選
      console.log("🎯 Applying district filter for:", selectedDistrict);

      if (!selectedDistrict || selectedDistrict === "all") {
        console.log(
          "❌ No district selected or selected 'all'. Skipping filter."
        );
        return;
      }

      setIsLoading(true);

      try {
        const result = await fetchLocationsByDistrict(
          selectedDistrict,
          activeDataType
        );

        // 確保回傳資料是有效的並且為陣列，然後根據行政區過濾
        if (result.success && Array.isArray(result.data)) {
          const filteredData = result.data.filter(
            (location) => location.district === selectedDistrict
          );

          console.log(
            `✅ Found ${filteredData.length} locations in ${selectedDistrict}:`,
            filteredData
          );
          setFilteredLocations(filteredData);
        } else {
          console.warn(
            "Static data call successful but no valid data:",
            result.message
          );
          setFilteredLocations([]); // 沒有符合條件的資料時清空
        }

        setFilteredPaths(null); // 清空任何已存在的路徑
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError("Failed to fetch locations");
        setFilteredLocations([]); // 出現錯誤時清空
      } finally {
        setIsLoading(false);
      }
    }
  }, [
    activeFilterType,
    selectedStation,
    selectedDistrict,
    mapData.shortestPaths,
    selectedLineStations,
    activeDataType,
  ]);

  // Add handler for filter type change
  const handleFilterTypeChange = useCallback((type) => {
    console.log("🔄 Changing filter type to:", type);
    setActiveFilterType(type);
    // Clear selections when switching filter types
    if (type === "mrt") {
      setSelectedDistrict("");
    } else {
      setSelectedMRT("");
      setSelectedStation("");
      setSelectedLineStations([]);
    }
    setFilteredPaths(null);
    setFilteredLocations([]); // 清空行政區篩選器
    setSelectedLocationId(null); // Clear selectedLocationId when changing filter types ＊＊＊非常確定就是這行修正：當選取 Dist. 時之前篩選器搜尋 MRT 結果並在FilterResults中點選path card產生的popup/pin殘留
    // setActiveDataType(type === "district" ? "exhibition" : "courses") // 預設選擇類型
  }, []);

  // Update the memoized components to include new props
  const memoizedFilterPanel = useMemo(
    () => (
      <FilterPanel
        metroData={metroData}
        districtData={mapData.taipeiDistricts}
        onLineSelect={handleLineSelect}
        onStationSelect={handleStationSelect}
        onDistrictSelect={handleDistrictSelect}
        onApplyFilter={handleApplyFilter}
        onDataTypeChange={handleDataTypeChange} // ⭐️ 傳遞清空邏輯
        activeDataType={activeDataType} // ⭐️ 傳入
        selectedMRT={selectedMRT}
        selectedStation={selectedStation}
        selectedDistrict={selectedDistrict}
        selectedLineStations={selectedLineStations}
        isLoading={isLoading}
        activeFilterType={activeFilterType}
        onFilterTypeChange={handleFilterTypeChange}
        onClearAll={handleClearAll} // FilterPanel中的clear all按鈕（傳入 MapView 裡已有的清除函式）
      />
    ),
    [
      handleLineSelect,
      handleStationSelect,
      handleDistrictSelect,
      handleApplyFilter,
      metroData,
      mapData.taipeiDistricts,
      selectedMRT,
      selectedStation,
      selectedDistrict,
      selectedLineStations,
      isLoading,
      activeFilterType,
      handleFilterTypeChange,
      activeDataType, // ✅ 確保 activeDataType 有變化時重新渲染
      handleDataTypeChange, // ✅ 加到 dependencies
    ]
  );

  // Update the memoizedMapView to include filteredLocations
  const memoizedMapView = useMemo(
    () => (
      <MapView
        mrtRoutes={mapData.mrtRoutes}
        taipeiDistricts={mapData.taipeiDistricts}
        selectedMRT={selectedMRT}
        selectedStation={selectedStation}
        selectedDistrict={selectedDistrict}
        selectedLineStations={selectedLineStations}
        shortestPaths={filteredPaths}
        filteredLocations={filteredLocations} // Pass the filtered locations
        onRouteClick={handleRouteClick} //MapView圖層選擇路線
        onStationClick={handleStationClick}
        onDistrictClick={handleDistrictClick} //MapView圖層點擊Dist
        activeFilterType={activeFilterType}
        selectedLocationId={selectedLocationId} // 新增管理地點狀態
        clickedStationLocations={clickedStationLocations}
        selectedType={activeDataType} // ✅ 確保 MapView 知道現在是 "courses" 或 "exhibition"
      />
    ),
    [
      mapData.mrtRoutes,
      mapData.taipeiDistricts,
      selectedMRT,
      selectedStation,
      selectedDistrict,
      selectedLineStations,
      filteredPaths,
      filteredLocations, // Add to dependencies
      handleRouteClick,
      handleStationClick,

      activeFilterType,
      selectedLocationId, // 新增FilterResults的地點到 dependencies
      clickedStationLocations,
      activeDataType, // ✅ 加到 dependencies，確保當 type 改變時重新渲染
    ]
  );

  if (isLoading && !mapData.mrtRoutes) return <div>Loading map data...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="map-page-wrapper relative w-screen h-[calc(100vh-80px)] mt-[80px]">
      {/* Map 滿版 */}
      <div className="map-content absolute inset-0 z-0">{memoizedMapView}</div>

      {/* FilterPanel 跟 FilterResults 一起包進panel-stack */}
      <div className="panel-stack" style={{ ["--panel-w"]: "245px" }}>
        {memoizedFilterPanel}

        <FilterResults
          filteredLocations={filteredLocations}
          selectedDistrict={selectedDistrict}
          selectedStation={selectedStation}
          selectedLineStations={selectedLineStations}
          activeFilterType={activeFilterType}
          shortestPaths={filteredPaths}
          onSelectLocation={setSelectedLocationId}
          selectedType={activeDataType}
        />
      </div>
    </div>
  );
}
