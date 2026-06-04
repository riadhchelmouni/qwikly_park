import ability from '@/plugins/casl/ability'
import { abilitiesPlugin } from '@casl/vue'

export default function (app) {
    app.use(abilitiesPlugin, ability, {
        useGlobalProperties: true,
    })
}
