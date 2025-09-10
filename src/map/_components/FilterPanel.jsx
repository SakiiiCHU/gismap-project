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
  const [open, setOpen] = useState(false); // 新增：控制手機收合

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
      } bg-black/30 backdrop-blur-md rounded-2xl p-6 shadow-lg text-white w-[300px]`}
    >
      {/* header 可點擊切換（手機當拉把），桌機無感 */}
      <div
        className="filter-header"
        role="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <h2>Filters</h2>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={
              (e) => e.stopPropagation()
              /* 避免點到 header 也收合 */
            }
          >
            Clear all
          </button>
        </div>
      </div>
      {/* 內容包一層，方便在手機展開時滾動 */}
      <div className="filter-body">
        <div className="filter-section">
          <div className="data-type-tabs">
            <button
              className={`tab-button ${
                activeDataType === "courses" ? "active" : ""
              }`}
              onClick={() => onDataTypeChange("courses")}
            >
              Course
            </button>
            <button
              className={`tab-button ${
                activeDataType === "exhibition" ? "active" : ""
              }`}
              onClick={() => onDataTypeChange("exhibition")}
            >
              Exhibit
            </button>
          </div>
        </div>

        <div className="filter-section">
          <span className="py-1">Search By...</span>
          <div className="filter-type-tabs">
            <button
              className={`tab-button ${
                activeFilterType === "mrt" ? "active" : ""
              }`}
              onClick={() => onFilterTypeChange("mrt")}
            >
              by MRT
            </button>
            <button
              className={`tab-button ${
                activeFilterType === "district" ? "active" : ""
              }`}
              onClick={() => onFilterTypeChange("district")}
            >
              by District
            </button>
          </div>

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

                {/* 捷運篩選專用的 Apply 按鈕，只在選擇「捷運」時顯示注意：和行政區的 Apply 是分開寫的 */}
                <button
                  onClick={() => {
                    onApplyFilter(); // 原本邏輯
                    setOpen(false); // Apply 後自動收合
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

                {/* 行政區篩選專用的 Apply 按鈕 */}
                <button
                  onClick={() => {
                    onApplyFilter(); // 原本送出邏輯：送出篩選
                    setOpen(false); // 新增：Apply 後自動收合
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
      </div>{" "}
      {/* /新包起來的filter-body */}
    </div>
  );
}
