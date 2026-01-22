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
      { id: 'lm1', name: 'Kwame Nkrumah Circle', cityId: 'accra', type: 'junction' },
      { id: 'lm2', name: 'Kejetia Market', cityId: 'kumasi', type: 'market' },
    ];
  }
}
