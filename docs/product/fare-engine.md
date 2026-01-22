# Fare Engine v0

## Inputs
- pickup coords (lat/lng)
- destination coords (lat/lng)
- vehicle type
- regionId (optional)
- distanceKm (optional; computed if missing)

## Output
- base fare
- distance fare
- region multiplier
- vehicle multiplier
- total price (GHS)

## Rules (v0)
- Base fare: 4.00 GHS
- Distance fare: 2.10 GHS per km
- Region multiplier:
  - metro: 1.20
  - urban: 1.05
  - rural: 0.90
  - default: 1.00
- Vehicle multiplier:
  - car: 1.0
  - motorbike: 0.7
  - pragya: 0.8
  - aboboyaa: 0.9

## Formula
`total = (baseFare + distanceFare) * regionMultiplier * vehicleMultiplier`

## Endpoint
`POST /fare/estimate`

## Notes
- Region tier is derived from the landmark region data.
- In the absence of regionId, default multiplier is used.
