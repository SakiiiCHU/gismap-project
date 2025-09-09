// Utility functions to replace backend API calls with JSON file reads

// Cache for loaded JSON data to avoid repeated fetches
const dataCache = {
  exhibitions: null,
  courses: null,
  realLocations: null,
}

// Load JSON data from public/map/ directory
async function loadJsonData(filename) {
  try {
    const response = await fetch(`/map/${filename}`)
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`)
    }
    const data = await response.json()

    if (Array.isArray(data) && data.length > 0 && data[data.length - 1]?.type === "table") {
      return data[data.length - 1].data || []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Error loading ${filename}:`, error)
    return []
  }
}

// Initialize data cache
async function initializeDataCache() {
  if (!dataCache.exhibitions) {
    dataCache.exhibitions = await loadJsonData("exhibition.json")
  }
  if (!dataCache.courses) {
    dataCache.courses = await loadJsonData("courses.json")
  }
  if (!dataCache.realLocations) {
    dataCache.realLocations = await loadJsonData("real_location.json")
  }
}

// Replace the /map?district=X&type=Y endpoint
export async function fetchLocationsByDistrict(district, type) {
  await initializeDataCache()

  const output = {
    success: false,
    data: [],
    message: "",
  }

  if (!district || !["exhibition", "courses"].includes(type)) {
    output.message = "Invalid parameters"
    return output
  }

  try {
    const realLocations = dataCache.realLocations || []
    const eventData = type === "courses" ? dataCache.courses || [] : dataCache.exhibitions || []

    // Filter locations by district
    const filteredLocations = realLocations.filter((location) => location.district === district)

    // Join with exhibition/course data
    const result = []

    for (const location of filteredLocations) {
      // Find events for this location
      const eventsAtLocation = eventData.filter((event) => event.locat_id === location.locat_id)

      // Create a result entry for each event
      for (const event of eventsAtLocation) {
        const resultItem = {
          id: type === "courses" ? event.c_id : event.e_id,
          name: type === "courses" ? event.c_name : event.e_name,
          startdate: type === "courses" ? event.c_startdate : event.e_startdate,
          enddate: type === "courses" ? event.c_enddate : event.e_enddate,
          locat_id: location.locat_id,
          locat_name: location.locat_name,
          city: location.city,
          district: location.district,
          address: location.address,
          latitude: Number.parseFloat(location.latitude) || 0,
          longitude: Number.parseFloat(location.longitude) || 0,
        }
        result.push(resultItem)
      }
    }

    output.success = true
    output.data = result
    output.message = "成功取得地圖資料"
  } catch (error) {
    console.error("Error fetching locations by district:", error)
    output.message = "資料載入錯誤"
  }

  return output
}

// Replace the /map/fetchLocations endpoint
export async function fetchLocationsByIds(locatIds, type) {
  await initializeDataCache()

  const output = {
    success: false,
    data: [],
    message: "",
  }

  if (!locatIds || !Array.isArray(locatIds) || !type) {
    output.message = "缺少必要參數 locatIds 或 type"
    return output
  }

  // Convert to numbers and filter out invalid IDs
  const validLocatIds = locatIds.map((id) => Number(id)).filter(Boolean)

  if (!validLocatIds.length) {
    output.message = "locatIds 參數格式錯誤"
    return output
  }

  try {
    const realLocations = dataCache.realLocations || []

    // Filter locations by IDs
    const locations = realLocations.filter((location) => validLocatIds.includes(Number(location.locat_id)))

    if (locations.length === 0) {
      output.message = "無相關地點資料"
      return output
    }

    // Add exhibition or course data to each location
    const eventData = type === "exhibition" ? dataCache.exhibitions || [] : dataCache.courses || []

    for (const location of locations) {
      location.latitude = Number.parseFloat(location.latitude) || 0
      location.longitude = Number.parseFloat(location.longitude) || 0

      if (type === "exhibition") {
        const exhibitions = eventData.filter((ex) => Number(ex.locat_id) === Number(location.locat_id))
        location.exhibitions = exhibitions.map((ex) => ({
          e_id: ex.e_id,
          e_name: ex.e_name,
          e_startdate: ex.e_startdate,
          e_enddate: ex.e_enddate,
          locat_id: ex.locat_id,
        }))
        location.type = "exhibition"
      } else if (type === "courses") {
        const courses = eventData.filter((co) => Number(co.locat_id) === Number(location.locat_id))
        location.courses = courses.map((co) => ({
          c_id: co.c_id,
          c_name: co.c_name,
          c_startdate: co.c_startdate,
          c_enddate: co.c_enddate,
          locat_id: co.locat_id,
        }))
        location.type = "courses"
      }
    }

    output.success = true
    output.data = locations
  } catch (error) {
    console.error("Error fetching locations by IDs:", error)
    output.message = "資料載入錯誤"
  }

  return output
}

export async function getAllLocationsByType(type) {
  await initializeDataCache()

  const output = {
    success: false,
    data: [],
    message: "",
  }

  try {
    const realLocations = dataCache.realLocations || []
    const eventData = type === "courses" ? dataCache.courses || [] : dataCache.exhibitions || []

    // Get all locations that have events of the specified type
    const locationsWithEvents = []

    for (const location of realLocations) {
      const eventsAtLocation = eventData.filter((event) => Number(event.locat_id) === Number(location.locat_id))

      if (eventsAtLocation.length > 0) {
        const locationWithEvents = {
          ...location,
          latitude: Number.parseFloat(location.latitude) || 0,
          longitude: Number.parseFloat(location.longitude) || 0,
        }

        if (type === "exhibition") {
          locationWithEvents.exhibitions = eventsAtLocation.map((ex) => ({
            e_id: ex.e_id,
            e_name: ex.e_name,
            e_startdate: ex.e_startdate,
            e_enddate: ex.e_enddate,
            locat_id: ex.locat_id,
          }))
        } else {
          locationWithEvents.courses = eventsAtLocation.map((co) => ({
            c_id: co.c_id,
            c_name: co.c_name,
            c_startdate: co.c_startdate,
            c_enddate: co.c_enddate,
            locat_id: co.locat_id,
          }))
        }

        locationsWithEvents.push(locationWithEvents)
      }
    }

    output.success = true
    output.data = locationsWithEvents
    output.message = "成功取得所有地點資料"
  } catch (error) {
    console.error("Error fetching all locations by type:", error)
    output.message = "資料載入錯誤"
  }

  return output
}
