import API from 'ipfs-api'
import { sortBy } from 'lodash-es'
import { join } from 'path'

const host = (process.env.NODE_ENV !== 'production') ? 'localhost' : window.location.hostname
const port = (process.env.NODE_ENV !== 'production') ? '5001' : (window.location.port || (window.location.protocol === 'https:' ? 443 : 80))
const localApi = new API(host, port)

// -- Public Interface

const prefix = '/ipfs/'

export const id = localApi.id

export const files = {
  list (root, api = localApi) {
    return api.files.ls(root)
      .then((res) => {
        const files = sortBy(res, 'name') || []

        return Promise.all(files.map((file) => {
          return api.files.stat(join(root, file.name))
            .then((stats) => {
              return {...file, ...stats}
            })
        }))
      })
  },

  mkdir (name, api = localApi) {
    return api.files.mkdir(name)
  },

  rmdir (name, api = localApi) {
    return api.files.rm(name, {recursive: true})
  },

  mv (from, to, api = localApi) {
    return api.files.mv([from, to])
  },

  createFiles (root, files, api = localApi) {
    // root is the directory we want to store the files in
    return Promise.all(files.map((file) => {
      const target = join(root, file.name)
      return api.files.write(target, file.content, {create: true})
    }))
  },

  createFile (root, file, api = localApi) {
    // return Promise((file) => {
    //   const target = join(root, file.name)
    //   return api.files.write(target, file.content, {create: true})
    // })
    const target = join(root, file.name)
    return api.files.write(target, file.content, {create: true})
  },
  // createFiles (root, fItems, api = localApi) {
  //   var output = []
  //   for (let i = 0; i < fItems.length; i++) {
  //     let entry = fItems[i].webkitGetAsEntry()
  //     output[i] = []
  //     output[i].push({path: entry.fullPath, content: null})
  //     traverseDir(entry, output[i]).then(result => {
  //       console.log(output[i])
  //       saveToIpfsmfs(root, output[i], api)
  //     })
  //   }
  // },

  traverseAction (fItem, output) {
    const entry = fItem.webkitGetAsEntry()

    output.push({path: entry.fullPath, content: null})
    return traverseDir(entry, output)
  },

  addAction (dataList, api = localApi) {
    var dirRoot = dataList[0].path
    return new Promise((resolve, reject) => {
      api.files.add(dataList, {recursive: true}, (err, results) => {
        if (!err) {
          for (let i = 0; i < results.length; i++) {
            console.log(i, '|', results[i].path, '|', results[i].hash, '|', dirRoot.substring(1))
            if (results[i].path === (dirRoot.substring(1))) {
              console.log('****', results[i].path, '|', dirRoot.substring(1))
              resolve({
                rootPath: dirRoot,
                rootHash: results[i].hash
              })
            }
          }
        } else {
          console.error('error:', err)
          // should show error message as baloon
          reject(err)
        }
      })
    })
  },
  // addFolders (root, fItem, api = localApi) {
  //   var output = []
  //   let entry = fItem.webkitGetAsEntry()
  //   output.push({path: entry.fullPath, content: null})
  //   traverseDir(entry, output).then(result => {
  //     console.log('output=', output)
  //     return addAction(output, api)
  //   })
  // },
  // addFolders (root, fItems, api = localApi) {
  //   var output = []
  //   for (let i = 0; i < fItems.length; i++) {
  //     let entry = fItems[i].webkitGetAsEntry()
  //     output[i] = []
  //     output[i].push({path: entry.fullPath, content: null})
  //     traverseDir(entry, output[i]).then(result => {
  //       console.log(output[i])
  //       return addAction(root, output[i], api)
  //     })
  //   }
  // },

  copyAction (hash, root, rootPath, api = localApi) {
    let fromPath = prefix + hash
    let toPath = root + rootPath
    console.log(fromPath, '|', toPath)
    return api.files.cp([fromPath, toPath])
  },

  stat (name, api = localApi) {
    return api.files.stat(name)
  },

  read (name, api = localApi) {
    return api.files.read(name)
  }
}

export const getConfig = (api = localApi) => {
  return api.config.get()
    .then((res) => JSON.parse(res.toString()))
}

export const saveConfig = (config, api = localApi) => {
  return api.config.replace(config)
}

function readFile (fileEntry, flist) {
  return new Promise((resolve, reject) => {
    fileEntry.file(file => {
      let reader = new FileReader()
      reader.onloadend = () => {
        let buffer = Buffer.from(reader.result)
        let fileItem = {path: fileEntry.fullPath, content: buffer}
        flist.push(fileItem)
        resolve(fileItem)
      }
      reader.readAsArrayBuffer(file)
    })
  })
}

function traverseDir (entry, list) {
  const reader = entry.createReader()
  // Resolved when the entire directory is traversed
  return new Promise((resolve, reject) => {
    const iterationAttempts = []

    function readEntries () {
      reader.readEntries((entries) => {
        if (!entries.length) {
          resolve(Promise.all(iterationAttempts))
        } else {
          iterationAttempts.push(Promise.all(entries.map((ientry) => {
            // console.log('ientry:', ientry)
            if (ientry.isFile) {
              let filePromise = readFile(ientry, list)
              return filePromise
            }
            if (ientry.isDirectory) {
              list.push({path: ientry.fullPath, content: null})
            }
            return traverseDir(ientry, list)
          })))
          readEntries()
        }
      }, error => reject(error))
    }

    readEntries()
  })
}

// function addAction (dataList, api) {
//   var dirRoot = dataList[0].path
//   return new Promise((resolve, reject) => {
//     api.files.add(dataList, {recursive: true}, (err, results) => {
//       if (!err) {
//         for (let i = 0; i < results.length; i++) {
//           console.log(i, '|', results[i].path, '|', results[i].hash, '|', dirRoot.substring(1))
//           if (results[i].path === (dirRoot.substring(1))) {
//             console.log('****', results[i].path, '|', dirRoot.substring(1))
//             resolve({
//               rootPath: dirRoot,
//               rootHash: results[i].hash
//             })
//           }
//         }
//       } else {
//         console.error('error:', err)
//         // should show error message as baloon
//         reject(err)
//       }
//     })
//   })
// }

function saveToIpfsmfs (root, dataList, api) {
  var dirRoot = dataList[0].path

  let addPromise = new Promise((resolve, reject) => {
    api.files.add(dataList, {recursive: true}, (err, results) => {
      if (!err) {
        for (let i = 0; i < results.length; i++) {
          // console.log(i, '|',results[i].path, "|", results[i].hash,'|' ,dirRoot)
          if (results[i].path === dirRoot.substring(1)) {
            resolve(results[i].hash)
          }
        }
      } else {
        console.error('error:', err)
        // should show error message as baloon
        reject(err)
      }
    })
  })

  addPromise.then((hash) => {
    let fromPath = prefix + hash
    let toPath = root + dirRoot.substring(1)
    console.log(fromPath, '|', toPath)
    localApi.files.cp([fromPath, toPath], (err) => {
      if (err) {
        console.error('copy err', err)
      }
    })
  })
}

// export const addFolders = (event, root, api = localApi) => {
//   var output = []
//   const data = event.dataTransfer.items
//   for (let i = 0; i < data.length; i++) {
//     let entry = data[i].webkitGetAsEntry()
//     output[i] = []
//     output[i].push({path: entry.fullPath, content: null})
//     traverseDir(entry, output).then(result => {
//       // console.log(output[i])
//       saveToIpfsmfs(root, output[i], api)
//     })
//   }
// }
