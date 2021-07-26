import { useState } from 'react'
import './Editor.css'
import AceEditor from 'react-ace'

import 'ace-builds/src-noconflict/mode-java'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/ext-language_tools'

type QlType = 'queries' | 'mutations' | 'subscriptions' | 'schema'

function Folder() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ height: 20, marginRight: 5 }}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
        </svg>
    )
}

function FileDocIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ height: 16, marginRight: 5, marginLeft: 20 }}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
        </svg>
    )
}

function CloseIcon(props: { onClick: any }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            height={10}
            style={{
                position: 'absolute',
                top: 5,
                right: 5,
                opacity: '0.4'
            }}
            onClick={props.onClick}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    )
}

function AddFileIcon(props: { onClick: any }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{
                height: 10,
                marginLeft: 'auto'
            }}
            onClick={props.onClick}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    )
}

function ClickableFolder(props: { name: string; addFile: any }) {
    return (
        <p
            style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 12
            }}
        >
            <Folder />
            {props.name}
            <AddFileIcon onClick={props.addFile} />
        </p>
    )
}

function ClickableFile(props: { name: string; onClick: any }) {
    return (
        <p
            style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 12
            }}
            onClick={props.onClick}
        >
            <FileDocIcon />
            {props.name}
        </p>
    )
}

type File = {
    name: string
    code: string
    open: boolean
    focsed: boolean
}

type Files = {
    queries: Record<string, File>
    mutations: Record<string, File>
    subscriptions: Record<string, File>
    schema: Record<string, File>
}

function SideBar(props: {
    files: Files
    open: (type: QlType, name: string) => void
    addFile: (type: QlType) => void
}) {
    return (
        <div className="sidebar">
            <ClickableFolder
                name="Queries"
                addFile={() => props.addFile('queries')}
            />
            {Object.keys(props.files.queries).map((k) => (
                <ClickableFile
                    name={props.files.queries[k].name}
                    onClick={() => props.open('queries', k)}
                />
            ))}
            <ClickableFolder
                name="Mutations"
                addFile={() => props.addFile('mutations')}
            />
            {Object.keys(props.files.mutations).map((k) => (
                <ClickableFile
                    name={props.files.mutations[k].name}
                    onClick={() => props.open('mutations', k)}
                />
            ))}
            <ClickableFolder
                name="Subscription"
                addFile={() => props.addFile('subscriptions')}
            />
            {Object.keys(props.files.subscriptions).map((k) => (
                <ClickableFile
                    name={props.files.subscriptions[k].name}
                    onClick={() => props.open('subscriptions', k)}
                />
            ))}
        </div>
    )
}

function FileTab(props: {
    active: boolean
    name: string
    type: string
    onClick: any
    onClose: any
}) {
    return (
        <div
            className={`file-tab ${props.active && 'file-tab-active'}`}
            onClick={props.onClick}
        >
            <CloseIcon onClick={() => props.onClose(props.type, props.name)} />
            <p>{props.name}</p>
        </div>
    )
}

type htmlBuffer = string[]
const defaultHtmlBuffer: htmlBuffer = []

const files: Files = {
    queries: {
        'getNotes.js': {
            name: 'getNotes.js',
            code: '',
            open: false,
            focsed: false
        },
        'getUsers.js': {
            name: 'getUsers.js',
            code: '',
            open: false,
            focsed: false
        }
    },
    mutations: {
        'createNote.js': {
            name: 'createNote.js',
            code: '',
            open: false,
            focsed: false
        }
    },
    subscriptions: {},
    schema: {}
}

type ActiveFileType = {
    type: QlType
    name: string
}

const defaultActiveFile: ActiveFileType = {
    type: 'schema',
    name: 'schema'
}

export default function TheEditor() {
    const [activeTab, setActiveTab] = useState(0)
    const [activeFile, setActiveFile] = useState(defaultActiveFile)

    const [schemaState, setSchemaState] = useState('')
    const [filesState, setFilesState] = useState(files)

    function openFile(type: QlType, name: string) {
        const updated: Files = {
            ...filesState,
            [type]: {
                ...filesState[type],
                [name]: {
                    ...filesState[type][name],
                    open: true
                }
            }
        }

        setFilesState(updated)
    }

    function closeFile(type: QlType, name: string) {
        const updated: Files = {
            ...filesState,
            [type]: {
                ...filesState[type],
                [name]: {
                    ...filesState[type][name],
                    open: false
                }
            }
        }

        setFilesState(updated)
    }

    function updateCode(type: QlType, name: string, code: string) {
        const updated: Files = {
            ...filesState,
            [type]: {
                ...filesState[type],
                [name]: {
                    ...filesState[type][name],
                    code: code
                }
            }
        }

        setFilesState(updated)
    }

    function addFile(type: QlType) {
        const name = Date.now().toString() + '.js'
        const updated: Files = {
            ...filesState,
            [type]: {
                ...filesState[type],
                [name]: {
                    name,
                    code: '',
                    open: false,
                    focsed: false
                }
            }
        }

        setFilesState(updated)
    }

    let currentCode: string = ''
    if (activeTab === 0) {
        currentCode = schemaState
    }

    if (activeTab > 0) {
        currentCode = filesState[activeFile.type][activeFile.name].code
    }

    return (
        <>
            <div className="editor">
                <SideBar
                    files={filesState}
                    open={openFile}
                    addFile={addFile}
                ></SideBar>
                <div className="content-container">
                    <div className="file-nav">
                        <FileTab
                            key={'schema'}
                            active={0 === activeTab}
                            name={'Schema'}
                            type={'schema'}
                            onClick={() => {
                                setActiveTab(0)
                                setActiveFile({
                                    type: 'schema',
                                    name: 'schema'
                                })
                            }}
                            onClose={() => {}}
                        />
                        {Object.keys(filesState.queries)
                            .filter((k) => filesState.queries[k].open)
                            .map((k, i) => (
                                <FileTab
                                    key={filesState.queries[k].name}
                                    active={i + 1 === activeTab}
                                    name={filesState.queries[k].name}
                                    onClick={() => {
                                        setActiveTab(i + 1)
                                        setActiveFile({
                                            type: 'queries',
                                            name: filesState.queries[k].name
                                        })
                                    }}
                                    type={'queries'}
                                    onClose={closeFile}
                                />
                            ))}
                        {Object.keys(filesState.mutations)
                            .filter((k) => filesState.mutations[k].open)
                            .map((k, i) => (
                                <FileTab
                                    key={filesState.mutations[k].name}
                                    active={i + 1 === activeTab}
                                    name={filesState.mutations[k].name}
                                    onClick={() => {
                                        setActiveTab(i + 1)
                                        setActiveFile({
                                            type: 'mutations',
                                            name: filesState.mutations[k].name
                                        })
                                    }}
                                    type={'mutations'}
                                    onClose={closeFile}
                                />
                            ))}
                        {Object.keys(filesState.subscriptions)
                            .filter((k) => filesState.subscriptions[k].open)
                            .map((k, i) => (
                                <FileTab
                                    key={filesState.subscriptions[k].name}
                                    active={i + 1 === activeTab}
                                    name={filesState.subscriptions[k].name}
                                    onClick={() => {
                                        setActiveTab(i + 1)
                                        setActiveFile({
                                            type: 'subscriptions',
                                            name:
                                                filesState.subscriptions[k].name
                                        })
                                    }}
                                    type={'subscriptions'}
                                    onClose={closeFile}
                                />
                            ))}
                    </div>

                    <button
                        className="inject-button"
                        onClick={() => {
                            const x = `module.exports = {
    api: \`
        type Query {
            something: string
        }
    \`,
    code: {}
}`
                            if (activeTab === 0) {
                                setSchemaState(x)
                            } else {
                                updateCode(activeFile.type, activeFile.name, x)
                            }
                        }}
                    >
                        Code
                    </button>

                    <AceEditor
                        mode="java"
                        theme="github"
                        onChange={(x) => {
                            if (activeTab === 0) {
                                setSchemaState(x)
                            } else {
                                updateCode(activeFile.type, activeFile.name, x)
                            }

                            // const copy = htmlBuffer.slice()
                            // copy[activeTab] = x
                            // updateCode(x)
                        }}
                        value={currentCode}
                        name="UNIQUE_ID_OF_DIV"
                        editorProps={{ $blockScrolling: true }}
                        width="100%"
                        height="568px"
                    />
                </div>
            </div>
        </>
    )
}
