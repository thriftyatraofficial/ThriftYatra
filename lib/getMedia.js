import axios from 'axios'

export const getMediaByLocation = async (location) => {
    try {
        const { data } = await axios.get(`/api/banners?active=true&location=${location}&limit=1`)
        if (data.success && data.data.length > 0) {
            return data.data[0]
        }
        return null
    } catch (error) {
        console.error(`Failed to load media for ${location}:`, error)
        return null
    }
}

export const getAllSliders = async () => {
    try {
        const { data } = await axios.get('/api/banners?active=true&location=home_slider&limit=10')
        if (data.success) {
            return data.data
        }
        return []
    } catch (error) {
        console.error('Failed to load sliders:', error)
        return []
    }
}