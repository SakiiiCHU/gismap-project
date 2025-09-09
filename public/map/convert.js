const fs = require('fs')

// -------- 轉換地點 venues.json --------
const locations = JSON.parse(fs.readFileSync('./venues.json', 'utf-8'))
const convertedLocations = locations.map(item => ({
  id: item.real_id,
  name: item.real_name,
  address: item.real_address,
  lat: item.real_lat,
  lng: item.real_lng,
}))
fs.writeFileSync('./venues.converted.json', JSON.stringify(convertedLocations, null, 2), 'utf-8')

// -------- 轉換展覽 exhibitions.json --------
const exhibitions = JSON.parse(fs.readFileSync('./exhibitions.json', 'utf-8'))
const convertedExhibitions = exhibitions.map(item => ({
  id: item.e_id,
  title: item.e_title,
  type: item.e_type,
  startDate: item.e_start,
  endDate: item.e_end,
  venueId: item.locat_id,
}))
fs.writeFileSync('./exhibitions.converted.json', JSON.stringify(convertedExhibitions, null, 2), 'utf-8')

// -------- 轉換課程 courses.json --------
const courses = JSON.parse(fs.readFileSync('./courses.json', 'utf-8'))
const convertedCourses = courses.map(item => ({
  id: item.course_id,
  title: item.course_title,
  startDate: item.course_start,
  endDate: item.course_end,
  venueId: item.locat_id,
}))
fs.writeFileSync('./courses.converted.json', JSON.stringify(convertedCourses, null, 2), 'utf-8')

console.log('✅ 所有檔案已成功轉換！')
