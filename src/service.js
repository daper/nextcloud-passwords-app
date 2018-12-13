import BackgroundJob from 'react-native-background-job'
import API, {
  Passwords,
  Folders,
} from './API'
import configureStore, {
  touchLastLogin,
} from './redux'

export const ServiceName = 'NextcloudPasswordsService'

class Service {
  constructor () {
    let { store, persistor } = configureStore()
    this.store = store
    this.persistor = persistor
    this.state = store.getState()
  }

  fetchState () {
    return new Promise((resolve, reject) => {
      let unsubscribe = this.store.subscribe(() => {
        const { app } = this.store.getState()
        if (app.settings.password !== '') {
          unsubscribe()

          this.state = app
          resolve(app)
        }
      })
    })
  }

  async init () {
    this.state = await this.fetchState()
    API.init(this.state.settings)
    await API.openDB()
  }

  async fetchData () {
    console.log('Fetching passwords...')
    await Passwords.fetchAll()
    console.log(('Fetching folders...'))
    await Folders.fetchAll()
    await this.store.dispatch(touchLastLogin())
    console.log('Done, persisting...')
    await this.persistor.persist()
  }
}

BackgroundJob.register({
  jobKey: ServiceName,
  job: async () => {
    const service = new Service()

    await service.init()
    await service.fetchData()

    if (__DEV__) console.log('Successfully fetched!')
  },
})

export function schedule (freq) {
  BackgroundJob.schedule({
    jobKey: ServiceName,
    notificationText: 'Syncing data...',
    notificationTitle: 'NextcloudPasswords',
    period: freq,
    timeout: 10 * 60 * 1000,
  })
}
