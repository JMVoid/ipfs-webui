import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {isEmpty, includes, map} from 'lodash-es'
import {join} from 'path'
// import {readAsBuffer} from '../../utils/files'
import {DropTarget, DragDropContext} from 'react-dnd'
import {NativeTypes} from 'react-dnd-html5-backend'
import HTML5Backend from 'react-dnd-html5-backend'
import classnames from 'classnames'
import CopyText from 'react-copy-text'

import RowInput from './tree/row-input'
import Row from './tree/row'
import FilesContextMenu from './context-menu'

import Modal from 'react-modal'
import QRCode from 'qrcode.react'


function makeFolderAwareHTML5Backend(manager) {
  const backend = HTML5Backend(manager);
  const orig = backend.handleTopDropCapture;
  backend.handleTopDropCapture = function(event) {
    backend.currentNativeSource.item.items = event.dataTransfer.items;
    return orig(event);
  }
  return backend;
}

const fileTarget = {
  drop (props, monitor) {
    // const dndItems = monitor.getItem().items
    // props.root
    // addFolders(dndItems,)
    props.onCreateFiles(monitor.getItem().items)
  //   Promise
  //     .all(map(monitor.getItem().files, readAsBuffer))
  //     .then((files) => {
  //       props.onCreateFiles(files)
  //     })
  }
}

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)'
  }
}

class Tree extends Component {

  constructor (){
    super()
    this.state = {copyHash: '',
                  showQRCode: false
                }
  }


  _onTmpDirChange = ({target}) => {
    this.props.onTmpDirChange(target.value)
  }

  _onDirCreateBlur = (event) => {
    if (isEmpty(event.target.value)) {
      this.props.onCancelCreateDir()
    } else {
      this.props.onCreateDir()
    }
  }

  _isSelected = (file) => {
    const {selectedFiles, root} = this.props
    return includes(selectedFiles, join(root, file.name))
  }

  _onCopyHash = () => {
    const { files, selectedFiles } = this.props
    const name = selectedFiles[0].split('/').pop()
    const file = files.find((f) => f.name === name)
    this.setState({copyHash: file.hash})
  }

  _onCopiedHash = () => {
    this.setState({copyHash: ''})
  }

  _onShowQRCode = () => {
    this._onCopyHash()
    this.setState({showQRCode: true})
  }

  _onCloseQRcode = () => {
    this._onCopiedHash()
    this.setState({showQRCode: false})
  }

  render () {
    let tmpDir
    if (this.props.tmpDir) {
      tmpDir = (
        <RowInput
          onChange={this._onTmpDirChange}
          value={this.props.tmpDir.name}
          onKeyEnter={this.props.onCreateDir}
          onKeyEsc={this.props.onCancelCreateDir}
          onBlur={this._onDirCreateBlur}
        />
      )
    }

    const files = this.props.files.map((file, i) => (
      <Row
        key={i}
        file={file}
        selected={this._isSelected(file)}
        onClick={this.props.onRowClick}
        onContextMenu={this.props.onRowContextMenu}
        onDoubleClick={this.props.onRowDoubleClick}
        onRemoveDir={this.props.onRemoveDir} />
    )).concat([tmpDir])

    const {isOver, canDrop, selectedFiles} = this.props
    const className = classnames('files-drop', {isOver, canDrop})

    // return (
    //   <div>
    //     <div className={className}>
    //       {!isOver && canDrop && 'Drag your files here'}
    //       {isOver && 'Drop your files'}
    //     </div>
    //     <div className='files-tree'>
    //       <div className='files-tree-header'>
    //         <div className='item'>Name</div>
    //         <div className='item'>Size</div>
    //       </div>
    //       <div className='files-tree-body'>
    //         {files}
    //       </div>
    //     </div>
    //     <FilesContextMenu
    //       selectedFiles={selectedFiles}
    //       onRemoveDir={this.props.onRemoveDir}
    //       onMoveDir={this.props.onMoveDir}
    //       onCopyHash={this._onCopyHash}
    //       onShowCode={this._onShowQRCode}/>
    //
    //     {this.state.showQRCode ? (
    //       <Modal isOpen={this.state.showQRCode}
    //              onRequestClose={this._onCloseQRcode}
    //              style={customStyles}>
    //         <QRCode value={this.state.copyHash} renderAs={'svg'} size={128} level='L'/>
    //       </Modal>) : (<CopyText text={this.state.copyHash} onCopied={this._onCopiedHash}/>)
    //     }
    //
    //   </div>
    // )

    // ***************

    return this.props.connectDropTarget(
      <div>
        <div className={className}>
          {!isOver && canDrop && 'Drag your files here'}
          {isOver && 'Drop your files'}
        </div>
        <div className='files-tree'>
          <div className='files-tree-header'>
            <div className='item'>Name</div>
            <div className='item'>Size</div>
          </div>
          <div className='files-tree-body'>
            {files}
          </div>
        </div>
        <FilesContextMenu
          selectedFiles={selectedFiles}
          onRemoveDir={this.props.onRemoveDir}
          onMoveDir={this.props.onMoveDir}
          onCopyHash={this._onCopyHash}
          onShowCode={this._onShowQRCode}/>

        {this.state.showQRCode ? (
          <Modal isOpen={this.state.showQRCode}
                 onRequestClose={this._onCloseQRcode}
                 style={customStyles}>
            <QRCode value={this.state.copyHash} renderAs={'svg'} size={128} level='L'/>
          </Modal>) : (<CopyText text={this.state.copyHash} onCopied={this._onCopiedHash}/>)
        }

      </div>
    )
  }
}

Tree.propTypes = {
  files: PropTypes.array,
  selectedFiles: PropTypes.array,
  tmpDir: PropTypes.shape({
    root: PropTypes.string.isRequired,
    name: PropTypes.string
  }),
  root: PropTypes.string,
  onRowClick: PropTypes.func,
  onRowContextMenu: PropTypes.func,
  onRowDoubleClick: PropTypes.func,
  onTmpDirChange: PropTypes.func.isRequired,
  onCreateDir: PropTypes.func.isRequired,
  onCancelCreateDir: PropTypes.func.isRequired,
  onCreateFiles: PropTypes.func.isRequired,
  onRemoveDir: PropTypes.func.isRequired,
  onMoveDir: PropTypes.func.isRequired,
  // react-dnd
  connectDropTarget: PropTypes.func.isRequired,
  isOver: PropTypes.bool.isRequired,
  canDrop: PropTypes.bool.isRequired
}

Tree.defaultProps = {
  root: '/',
  files: [],
  selectedFiles: [],
  onRowClick () {},
  onRowContextMenu () {},
  onRowDoubleClick () {}
}


export default DragDropContext(makeFolderAwareHTML5Backend)(DropTarget(
  NativeTypes.FILE,
  fileTarget,
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })
)(Tree))


// export default DropTarget(
//   NativeTypes.FILE,
//   // NativeTypes,
//   fileTarget,
//   (connect, monitor) => ({
//     connectDropTarget: connect.dropTarget(),
//     isOver: monitor.isOver(),
//     canDrop: monitor.canDrop()
//   })
// )(Tree)
