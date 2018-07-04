import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {isEmpty, map} from 'lodash-es'
import {readAsBuffer} from '../../utils/files'

import Icon from '../../views/icon'
// import Modal from 'react-modal'
// import UploadFolder from './uploadFolder'
//
// const customStyles = {
//   content: {
//     top: '50%',
//     left: '50%',
//     right: 'auto',
//     bottom: 'auto',
//     marginRight: '-50%',
//     transform: 'translate(-50%, -50%)'
//   }
// }

class ActionBar extends Component {

  constructor () {
    super()
    this.state = {uploadShow:false}
  }

  _onUploadClick = event => {
    this.fileInput.click()
  }

  _onFilesChange = event => {
    const rawFiles = this.fileInput.files
    const { onCreateFiles } = this.props

    Promise
      .all(map(rawFiles, readAsBuffer))
      .then((files) => {
        onCreateFiles(files)
      })

    this.fileInput.value = null
  }

  // _popUpModal = event => {
  //     this.setState({uploadShow:true})
  // }
  //
  // _closeModal = event => {
  //   this.setState({uploadShow:false})
  // }

  render () {
    const {
      selectedFiles,
      onRemoveDir,
      onMoveDir,
      onCreateDir
    } = this.props
    let fileActions

    if (!isEmpty(selectedFiles)) {
      const length = selectedFiles.length
      const plural = length > 1 ? 's' : ''
      const count = `${length} file${plural}`

      fileActions = ([
        <div className='action-bar-file-actions'>
          <a onClick={onMoveDir}>
            <Icon glyph='pencil' />
            Rename
          </a>
        </div>,
        <div className='action-bar-file-actions'>
          <a onClick={onRemoveDir}>
            <Icon glyph='minus' />
            Delete {count}
          </a>
        </div>
      ])
    }

    return (
      <div className='action-bar'>
        <div className='action-bar-general-actions'>
          <a onClick={onCreateDir}>
            <Icon glyph='plus' />
            Create Folder
          </a>
        </div>
        <div className='action-bar-general-actions'>
          <a onClick={this._onUploadClick}>
            <Icon glyph='upload' />
            Upload
          </a>
        </div>
        {/*<div className='action-bar-general-actions'>*/}
          {/*<a onClick={this._popUpModal}>*/}
            {/*<Icon glyph='upload'/>*/}
            {/*Upload Dir*/}
          {/*</a>*/}
        {/*</div>*/}
        <input
          type='file'
          className='hidden'
          multiple
          ref={(input) => { this.fileInput = input }}
          onChange={this._onFilesChange} />
        {fileActions}

        {/*<Modal isOpen={this.state.uploadShow} onRequestClose={this._closeModal} style={customStyles}>*/}
          {/*<UploadFolder/>*/}
        {/*</Modal>*/}
      </div>
    )
  }
}

ActionBar.propTypes = {
  onCreateDir: PropTypes.func.isRequired,
  onRemoveDir: PropTypes.func.isRequired,
  onMoveDir: PropTypes.func.isRequired,
  onCreateFiles: PropTypes.func.isRequired,
  selectedFiles: PropTypes.array.isRequired
}

export default ActionBar
