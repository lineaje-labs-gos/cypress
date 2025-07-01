import util from '../util.js'

export default {
  wrapBefore (ipc, invoke, ids, args) {
    util.wrapChildPromise(ipc, invoke, ids, args)
  },
}
