import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { LocalStorage } from '../../src'
import { MatrixClient } from '../../src/matrix-client/MatrixClient'
import * as sinon from 'sinon'
import { MatrixRoomStatus } from '../../src/matrix-client/models/MatrixRoom'
import { MatrixHttpClient } from '../../src/matrix-client/MatrixHttpClient'
import { MatrixClientEventType } from '../../src/matrix-client/models/MatrixClientEvent'

MatrixClient
// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`MatrixClient`, () => {
  let client: MatrixClient
  beforeEach(() => {
    sinon.restore()
    client = MatrixClient.create({
      baseUrl: `https://test.walletbeacon.io`,
      storage: new LocalStorage()
    })
  })

  it(`should create with options`, async () => {
    expect(client).to.not.be.undefined
  })

  it(`should return joined rooms (case: empty)`, async () => {
    expect(client.joinedRooms).to.deep.equal([])
  })

  it(`should return joined rooms (case: 1 room)`, async () => {
    const rooms = [{ status: MatrixRoomStatus.JOINED }]
    const storeStub = sinon.stub((<any>client).store, 'get').returns(rooms)

    expect(client.joinedRooms).to.deep.equal(rooms)
    expect(storeStub.callCount).to.equal(1)
    expect(storeStub.firstCall.args[0]).to.equal('rooms')
  })

  it(`should return invited rooms (case: empty)`, async () => {
    expect(client.invitedRooms).to.deep.equal([])
  })

  it(`should return invited rooms (case: 1 room)`, async () => {
    const rooms = [{ status: MatrixRoomStatus.INVITED }]
    const storeStub = sinon.stub((<any>client).store, 'get').returns(rooms)

    expect(client.invitedRooms).to.deep.equal(rooms)
    expect(storeStub.callCount).to.equal(1)
    expect(storeStub.firstCall.args[0]).to.equal('rooms')
  })

  it(`should return left rooms (case: empty)`, async () => {
    expect(client.leftRooms).to.deep.equal([])
  })

  it(`should return left rooms (case: 1 room)`, async () => {
    const rooms = [{ status: MatrixRoomStatus.LEFT }]
    const storeStub = sinon.stub((<any>client).store, 'get').returns(rooms)

    expect(client.leftRooms).to.deep.equal(rooms)
    expect(storeStub.callCount).to.equal(1)
    expect(storeStub.firstCall.args[0]).to.equal('rooms')
  })

  it.skip(`should start`, async () => {
    const sendStub = sinon.stub(MatrixHttpClient.prototype, <any>'send')
    sendStub.withArgs('POST', '/login').resolves({
      user_id: '@pubkey:url',
      access_token: 'access-token',
      home_server: 'url',
      device_id: 'my-id'
    })
    sendStub.withArgs('GET', '/sync').resolves({
      account_data: { events: [] },
      to_device: { events: [] },
      device_lists: { changed: [], left: [] },
      presence: { events: [] },
      rooms: { join: {}, invite: {}, leave: {} },
      groups: { join: {}, invite: {}, leave: {} },
      device_one_time_keys_count: {},
      next_batch: 's793973_746830_0_1_1_1_1_17384_1'
    })

    await client.start({
      id: 'random-id',
      password: `ed:sig:pubkey`,
      deviceId: 'pubkey'
    })

    expect(sendStub.callCount).to.equal(2)
  })

  it.skip(`should retry on start`, async () => {
    const sendStub = sinon.stub(MatrixHttpClient.prototype, <any>'send')
    sendStub.withArgs('POST', '/login').resolves({
      user_id: '@pubkey:url',
      access_token: 'access-token',
      home_server: 'url',
      device_id: 'my-id'
    })
    sendStub.withArgs('GET', '/sync').throws('my-error')

    try {
      await client
        .start({
          id: 'random-id',
          password: `ed:sig:pubkey`,
          deviceId: 'pubkey'
        })
        .catch((err) => {
          console.log('my-err', err)
        })
    } catch (e) {
      console.log(e)
      expect(sendStub.callCount).to.equal(4)
    }
  })

  it(`should subscribe`, async () => {
    const onStub = sinon.stub((<any>client).eventEmitter, 'on').resolves()

    const cb = () => null
    client.subscribe(MatrixClientEventType.MESSAGE, cb)

    expect(onStub.callCount).to.equal(1)
    expect(onStub.firstCall.args[0]).to.equal(MatrixClientEventType.MESSAGE)
    expect(onStub.firstCall.args[1]).to.equal(cb)
  })

  it(`should unsubscribe one`, async () => {
    const removeStub = sinon.stub((<any>client).eventEmitter, 'removeListener').resolves()
    const removeAllStub = sinon.stub((<any>client).eventEmitter, 'removeAllListeners').resolves()

    const cb = () => null
    client.unsubscribe(MatrixClientEventType.MESSAGE, cb)

    expect(removeAllStub.callCount).to.equal(0)
    expect(removeStub.callCount).to.equal(1)
    expect(removeStub.firstCall.args[0]).to.equal(MatrixClientEventType.MESSAGE)
    expect(removeStub.firstCall.args[1]).to.equal(cb)
  })

  it(`should unsubscribe all events`, async () => {
    const removeStub = sinon.stub((<any>client).eventEmitter, 'removeListener').resolves()
    const removeAllStub = sinon.stub((<any>client).eventEmitter, 'removeAllListeners').resolves()

    client.unsubscribe(MatrixClientEventType.MESSAGE)

    expect(removeStub.callCount).to.equal(0)
    expect(removeAllStub.callCount).to.equal(1)
    expect(removeAllStub.firstCall.args[0]).to.equal(MatrixClientEventType.MESSAGE)
  })

  it(`should get a room by id`, async () => {
    const getRoomStub = sinon.stub((<any>client).store, 'getRoom').resolves()

    const id = 'my-id'
    client.getRoomById(id)

    expect(getRoomStub.callCount).to.equal(1)
    expect(getRoomStub.firstCall.args[0]).to.equal(id)
  })

  it.skip(`should create a trusted private room`, async () => {
    expect(true).to.be.false
  })

  it(`should invite a user to a room`, async () => {
    const getRoomStub = sinon.stub((<any>client).store, 'getRoom').returns('room')
    // const eventSyncStub = sinon.stub((<any>client).roomService, 'inviteToRoom').resolves()

    const syncStub = sinon
      .stub(client, <any>'requiresAuthorization')
      .callsArgWithAsync(1, 'myToken')
      .resolves()

    await client.inviteToRooms('user', '1', '2', '3')

    expect(syncStub.callCount).to.equal(1)
    expect(getRoomStub.callCount).to.equal(3)
    // expect(eventSyncStub.callCount).to.equal(3)
  })

  it(`should join rooms`, async () => {
    const getRoomStub = sinon.stub((<any>client).store, 'getRoom').returns('room')
    const eventSyncStub = sinon.stub((<any>client).roomService, 'joinRoom').resolves()

    const syncStub = sinon
      .stub(client, <any>'requiresAuthorization')
      .callsArgWithAsync(1, 'myToken')
      .resolves()

    await client.joinRooms('1', '2', '3')

    expect(syncStub.callCount).to.equal(1)
    expect(getRoomStub.callCount).to.equal(3)
    expect(eventSyncStub.callCount).to.equal(3)
  })

  it(`should send a text message`, async () => {
    const getRoomStub = sinon.stub((<any>client).store, 'getRoom').returns('room')
    const createTxStub = sinon.stub(<any>client, 'createTxnId').returns('random-id')

    const eventSyncStub = sinon.stub((<any>client).eventService, 'sendMessage').resolves()

    const syncStub = sinon
      .stub(client, <any>'requiresAuthorization')
      .callsArgWithAsync(1, 'myToken')
      .resolves()

    await client.sendTextMessage('123', 'my-message')

    expect(getRoomStub.callCount).to.equal(1)
    expect(createTxStub.callCount).to.equal(1)
    expect(syncStub.callCount).to.equal(1)
    expect(eventSyncStub.callCount).to.equal(1)
  })

  // TODO: Add failed send

  it.skip(`should poll the server for updates`, async () => {
    expect(true).to.be.false
  })

  it(`should send a sync request to the server`, async () => {
    const getStub = sinon.stub((<any>client).store, 'get').returns('test-item')

    const eventSyncStub = sinon.stub((<any>client).eventService, 'sync').resolves()

    const syncStub = sinon
      .stub(client, <any>'requiresAuthorization')
      .callsArgWithAsync(1, 'myToken')
      .resolves()

    await (<any>client).sync()

    expect(getStub.callCount).to.equal(2)
    expect(syncStub.callCount).to.equal(1)
    expect(eventSyncStub.callCount).to.equal(1)
  })

  it(`should check if an access token is present`, async () => {
    const myToken = 'my-token'

    const getStub = sinon.stub((<any>client).store, 'get').returns(myToken)

    return new Promise(async (resolve, _reject) => {
      const cb = (token) => {
        expect(token).to.equal(myToken)
        expect(getStub.callCount).to.equal(1)

        resolve()
      }
      await (<any>client).requiresAuthorization('my-name', cb)
    })
  })

  it(`should create a transaction id`, async () => {
    const counter = 1
    const getStub = sinon.stub((<any>client).store, 'get').returns(counter)
    const updateStub = sinon.stub((<any>client).store, 'update').resolves()

    const id = await (<any>client).createTxnId()

    expect(getStub.callCount).to.equal(1)
    expect(updateStub.callCount).to.equal(1)
    expect(updateStub.firstCall.args[0]).to.deep.equal({
      txnNo: counter + 1
    })
    expect(id.startsWith('m')).to.be.true
    expect(id.includes('.')).to.be.true
    expect(id.includes(counter)).to.be.true
  })
})
