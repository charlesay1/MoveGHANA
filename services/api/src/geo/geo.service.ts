import { Injectable } from '@nestjs/common';

@Injectable()
export class GeoService {
  getRegions() {
    return [
      { id: 'gr1', name: 'Greater Accra', capital: 'Accra' },
      { id: 'as1', name: 'Ashanti', capital: 'Kumasi' },
    ];
  }

  getCities() {
    return [
      { id: 'accra', name: 'Accra', regionId: 'gr1' },
      { id: 'kumasi', name: 'Kumasi', regionId: 'as1' },
    ];
  }

  getLandmarks() {
    return [
      {
        id: 'lm1',
        name: 'Kwame Nkrumah Circle',
        cityId: 'accra',
        type: 'junction',
        lat: 5.5677,
        lng: -0.2111,
      },
      { id: 'lm2', name: 'Kejetia Market', cityId: 'kumasi', type: 'market', lat: 6.6873, lng: -1.6244 },
    ];
  }
}
