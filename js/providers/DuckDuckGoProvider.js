// js/providers/DuckDuckGoProvider.js

import { SearchProvider } from './SearchProvider.js';

export class DuckDuckGoProvider extends SearchProvider {
    constructor() {
        super('DuckDuckGo Search');
    }

    async search(filters) {
        console.log(
            `[DuckDuckGoProvider] Búsqueda real pendiente: "${filters.rubro}" en "${filters.ciudad}"`
        );

        /*
         * IMPORTANTE:
         *
         * No devolvemos datos ficticios.
         *
         * Este proveedor será implementado después
         * mediante búsqueda real en DuckDuckGo.
         */

        return [];
    }
}