"use client";

import { useEffect, useRef, useState } from "react";
import "./FilterPanel.css";

export default function FilterPanel({
  metroData,
  districtData,
  onLineSelect,
  onStationSelect,
  onDistrictSelect,
  onApplyFilter,
  onDataTypeChange,
  selectedMRT,
  selectedStation,
  selectedDistrict,
  selectedLineStations,
  isLoading,
  activeFilterType,
  activeDataType,
  onFilterTypeChange,
}) {
  const lineSelectRef = useRef(null);
  const districtSelectRef = useRef(null);
  const [open, setOpen] = useState(() => window.innerWidth > 768); //// 控制手機/桌面開合狀態：桌面預設展開避免 Safari 空白

  // Update dropdown when selectedMRT changes from map
  useEffect(() => {
    console.log("🔄 Updating dropdown value to:", selectedMRT);
    if (lineSelectRef.current) {
      lineSelectRef.current.value = selectedMRT || "";
    }
  }, [selectedMRT]);

  // Update Dist. when MapView changes
  useEffect(() => {
    console.log("🏙️ Updating district dropdown to:", selectedDistrict);
    if (districtSelectRef.current) {
      districtSelectRef.current.value = selectedDistrict || "";
    }
  }, [selectedDistrict]);

  return (
    <div
      className={`filter-panel ${
        open ? "open" : ""
      }  backdrop-blur-md rounded-2xl p-6  text-white`}
      onClick={(e) => {
        // 點到 panel 本體或 header（但不是 clear-all）都可以開合
        const clickedClearAll = e.target.closest(".clear-all");
        const clickedHeader = e.target.closest(".filter-header");
        if (
          !clickedClearAll &&
          (e.target === e.currentTarget || clickedHeader)
        ) {
          setOpen((o) => !o);
        }
      }}
    >
      {/* header（非觸發區，只負責顯示） */}
      <div className="filter-header">
        <h2>Filters</h2>
        <div style={{ marginLeft: "auto" }}>
          <button
            className="clear-all"
            onClick={(e) => {
              e.stopPropagation(); // 避免觸發 panel 開合
              onClearAll?.();
            }}
          >
            Clear all
          </button>
        </div>
      </div>

      {/* 內容包一層，方便在手機展開時滾動 */}
      <div className="filter-body">
        {/* --- 課程 / 展覽 Tabs --- */}
        <div className="filter-section">
          <div className="pill-tabs">
            <div
              className="pill-cursor"
              style={{
                transform:
                  activeDataType === "courses"
                    ? "translateX(0%)"
                    : "translateX(100%)",
              }}
            />
            <button
              className={`pill-tab ${
                activeDataType === "courses" ? "active" : ""
              }`}
              onClick={() => onDataTypeChange("courses")}
            >
              Course
            </button>
            <button
              className={`pill-tab ${
                activeDataType === "exhibition" ? "active" : ""
              }`}
              onClick={() => onDataTypeChange("exhibition")}
            >
              Exhibit
            </button>
          </div>
        </div>

        {/* --- 搜尋方式 Tabs --- */}
        <div className="filter-header">
          <h2>Search By...</h2>
        </div>
        <div className="filter-section">
          <div className="filter-type-tabs pill-tabs">
            <div
              className="pill-cursor"
              style={{
                transform:
                  activeFilterType === "mrt"
                    ? "translateX(0%)"
                    : "translateX(100%)",
              }}
            />
            <button
              className={`pill-tab ${
                activeFilterType === "mrt" ? "active" : ""
              }`}
              onClick={() => onFilterTypeChange("mrt")}
            >
              MRT
            </button>
            <button
              className={`pill-tab ${
                activeFilterType === "district" ? "active" : ""
              }`}
              onClick={() => onFilterTypeChange("district")}
            >
              District
            </button>
          </div>

          {/* --- MRT 選擇 --- */}
          {activeFilterType === "mrt" && (
            <div className="filter-section mt-4">
              <div className="dropdown-group">
                <select
                  ref={lineSelectRef}
                  value={selectedMRT || ""}
                  onChange={onLineSelect}
                  className="filter-select"
                >
                  <option value="">Select MRT line</option>
                  <option value="all">All Lines</option>
                  {metroData?.mrt_lines?.map((line) => (
                    <option key={line.line} value={line.line}>
                      {line.line}
                    </option>
                  ))}
                </select>

                {selectedMRT && (
                  <select
                    value={selectedStation || ""}
                    onChange={(e) => onStationSelect(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Select station</option>
                    <option value="all">All Stations</option>
                    {selectedLineStations?.map((station) => (
                      <option
                        key={station.station_id}
                        value={station.station_id}
                      >
                        {station.name_chinese} {station.name_english}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => {
                    onApplyFilter();
                    setOpen(false);
                  }}
                  disabled={
                    isLoading ||
                    !activeDataType ||
                    (!selectedStation && !selectedDistrict)
                  }
                  className="apply-button w-full bg-black text-white rounded-full disabled:cursor-not-allowed hover:bg-yellow"
                >
                  {isLoading ? "Loading..." : "Apply Filter"}
                </button>
              </div>
            </div>
          )}

          {/* --- District 選擇 --- */}
          {activeFilterType === "district" && (
            <div className="filter-section mt-4">
              <div className="dropdown-group">
                <select
                  ref={districtSelectRef}
                  value={selectedDistrict || ""}
                  onChange={(e) => onDistrictSelect(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Select district</option>
                  <option value="all">All Districts</option>
                  {districtData?.features?.map((district) => (
                    <option
                      key={district.properties.TNAME}
                      value={district.properties.TNAME}
                    >
                      {district.properties.TNAME}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    onApplyFilter();
                    setOpen(false);
                  }}
                  disabled={
                    isLoading ||
                    !activeDataType ||
                    !selectedDistrict ||
                    selectedDistrict === "all"
                  }
                  className="apply-button w-full bg-black text-white rounded-full disabled:cursor-not-allowed hover:bg-yellow"
                >
                  {isLoading ? "Loading..." : "Apply Filter"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
