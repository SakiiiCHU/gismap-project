
import { useState, useCallback } from "react"

export function useMapInteractions() {
  const [hoveredRoute, setHoveredRoute] = useState(null)
  const [hoveredDistrict, setHoveredDistrict] = useState(null)

  const handleRouteHover = useCallback((routeCode, isHovering) => {
    setHoveredRoute(isHovering ? routeCode : null)
  }, [])

  const handleDistrictHover = useCallback((districtName, isHovering) => {
    setHoveredDistrict(isHovering ? districtName : null)
  }, [])

  return {
    hoveredRoute,
    hoveredDistrict,
    handleRouteHover,
    handleDistrictHover,
  }
}

