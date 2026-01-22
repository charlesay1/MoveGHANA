# Ghana Landmarks Data

## Source
`services/locations/ghana-landmarks.json`

## Structure
```json
{
  "regions": [{ "id": "greater_accra", "name": "Greater Accra", "capital": "Accra", "tier": "metro" }],
  "landmarks": [{ "id": "ga_market_1", "name": "Makola Market", "category": "market", "regionId": "greater_accra" }]
}
```

## Categories
- market
- junction
- church
- lorry_station
- mall
- hospital
- school
- government

## Filters
- Query (`q`): fuzzy search on name
- Category (`category`)
- Region (`regionId`)
- Limit (`limit`)

## Recent Locations
Recent destinations are stored locally in Rider using `expo-secure-store` and surfaced on the Home bottom sheet and destination screen.
