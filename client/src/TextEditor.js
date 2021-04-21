import React, { useState, useEffect, useCallback } from 'react'
import Quill from 'quill'
import "quill/dist/quill.snow.css"
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const TOOLBAR_OPTIONS = [
    ['bold', 'italic', 'underline', 'strike'],         // toggled buttons
    ['image', 'blockquote', 'code-block'],
  
    [{ header: [1, 2, 3, 4, 5, 6, false] }],           // custom button values
    [{ list: 'ordered'}, { list: 'bullet' }],
    [{ script: 'sub'}, { script: 'super' }],           // superscript/subscript
    [{ indent: '-1'}, { indent: '+1' }],               // outdent/indent
  
    [{ size: ['small', false, 'large', 'huge'] }],     // custom dropdown
  
    [{ color: [] }, { background: [] }],               // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ['clean']                                          // remove formatting button
];

const SAVE_INTERVAL_MS = 2000

const TextEditor = () => {
    const { id: documentId } = useParams()
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()

    // handle connection
    useEffect(() => {
        const _socket = io('https://ashwanidoc.herokuapp.com')
        setSocket(_socket)

        return () => {
            _socket.disconnect()
        }
    }, [])

    // get document
    useEffect(() => {
        if (!socket || !quill || !documentId) return

        const handler = (delta) => {
            quill.updateContents(delta)
        }

        socket.once('load-document', document => {
            quill.setContents(document)
            quill.enable()
        })

        socket.emit('get-document', documentId)

        return () => {
            socket.off('receive-changes', handler)
        }
    }, [socket, quill, documentId])

    // save document
    useEffect(() => {
        if (!socket || !quill) return

        const interval = setInterval(() => {
            socket.emit('save-document', quill.getContents())
        }, SAVE_INTERVAL_MS)

        return () => {
            clearInterval(interval)
        }
    }, [socket, quill])

    // send delta
    useEffect(() => {
        if (!socket || !quill) return

        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return

            socket.emit('send-changes', delta)
        }

        quill.on('text-change', handler)

        return () => {
            quill.off('text-change', handler)
        }
    }, [socket, quill])

    // receive delta
    useEffect(() => {
        if (!socket || !quill) return

        const handler = (delta) => {
            quill.updateContents(delta)
        }

        socket.on('receive-changes', handler)

        return () => {
            socket.off('receive-changes', handler)
        }
    }, [socket, quill])

    // handle quill client
    const wrapperRef = useCallback((wrapper) => {
        if (!wrapper) return

        wrapper.innerHTML = ''
        const editor = document.createElement('div')
        wrapper.append(editor)
        const _quill = new Quill(editor, { theme: 'snow', modules: { toolbar: TOOLBAR_OPTIONS } })

        _quill.disable()
        _quill.enable(false)
        _quill.setText('loading...')
        setQuill(_quill)
    }, [])
    return <div className="container" ref={wrapperRef}></div>
}

export default TextEditor
