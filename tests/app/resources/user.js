
import genericRoutes from '../../../lib/generic-routes';

export default {
    auth: 'token', // overwrite admin scope
    routes: genericRoutes.all
};