import { useState, useRef } from 'react'
import './Editor.css'
import AceEditor from 'react-ace'

import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/theme-monokai'
import 'ace-builds/src-noconflict/theme-dracula'
import 'ace-builds/src-noconflict/ext-language_tools'

// https://tmtheme-editor.herokuapp.com/#!/editor/theme/Material%20Theme

import prettier from 'prettier/standalone.js'
import parser from 'prettier/parser-babel'
import templates from './templates'
import make from '../../utils/make'
import Visual from '../Visual'
const YAML = require('json-to-pretty-yaml')

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

function NextIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
        </svg>
    )
}

function BackIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
        </svg>
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
    updateCode: any
    insertCode: any
    showVisual: any
    setShowVisual: any
    setShowBigVisual: any
}) {
    return (
        <div className="sidebar">
            <button
                className="inject-template-button"
                onClick={() =>
                    props.updateCode(`module.exports = {
    schema: \`
        type Query {
            myQuery: string
        }

        type Mutation {
            myMutation: string
        }
    \`,
    resolvers: {
        Query: {
            myQuery: [

            ]
        },
        Mutation: {
            myMutation: [

            ]
        },
        Events: {
            event1: [

            ]
        }
    },
    config: {
        name: 'myApp',
        region: 'us-east-2'
    }
}`)
                }
            >
                Empty
            </button>
            <button
                className="inject-template-button"
                onClick={() => props.updateCode(templates.crudl)}
            >
                CRUDL
            </button>
            <button
                className="inject-template-button"
                onClick={() => props.updateCode(templates.group)}
            >
                Group
            </button>
            <button
                className="inject-template-button"
                onClick={() => props.updateCode(templates.sendAndReceive)}
            >
                Send and Receive
            </button>
            <button
                className="inject-button"
                onClick={() =>
                    props.insertCode(`{
                    type: 'add',
                    sk: '@id'
                },
                
                `)
                }
            >
                Add
            </button>
            <button
                className="inject-button"
                onClick={() =>
                    props.insertCode(`{
                    type: 'guard',
                    pk: 'team_1234',
                    sk: '!id'
                },
                
                `)
                }
            >
                Guard
            </button>
            <button
                className="inject-button"
                onClick={() =>
                    props.insertCode(`{
                        type: 'db',
                        action: 'get'
                    },
                `)
                }
            >
                Get
            </button>
            <button
                className="inject-button"
                onClick={() =>
                    props.insertCode(`{
                        type: 'db',
                        action: 'list'
                    },
                `)
                }
            >
                List
            </button>
            <button
                className="inject-button"
                onClick={() =>
                    props.insertCode(`{
                        type: 'db',
                        action: 'create'
                    },
                `)
                }
            >
                Create
            </button>
            <button
                className="inject-button"
                onClick={() =>
                    props.insertCode(`{
                        type: 'db',
                        action: 'remove'
                    },
                `)
                }
            >
                Remove
            </button>
            <button
                className="inject-button"
                onClick={() =>
                    props.insertCode(`{
                        type: 'emit-event',
                        event: 'my-event',
                        data: {}
                    },
                `)
                }
            >
                Emit Event
            </button>
            <button
                className="inject-button"
                onClick={() =>
                    props.insertCode(`{
                    type: 'trigger-mutation',
                    source: 'accounting',
                    event: 'processCompleted',
                    query: \`
                        mutation complete($input: CompleteInput) {
                            complete(input: $input)
                        }
                    \`,
                    variables: {
                        pk: 'detail.pk',
                        sk: 'detail.sk',
                        event: 'detail.event'
                    }
                },
            `)
                }
            >
                Receive Event
            </button>

            <button
                className="visual-button"
                onClick={() => props.setShowVisual(!props.showVisual)}
            >
                {props.showVisual ? 'Hide Visual' : 'Show Visual'}
            </button>
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

export default function TheEditor() {
    const [screen, setScreen] = useState('edit')
    const [doneScreen, setDoneScreen] = useState('template')
    const [code, setCode] = useState('')
    const [showVisual, setShowVisual] = useState(false)
    const [showBigVisual, setShowBigVisual] = useState(false)
    const [position, setPosition] = useState({ row: 0, column: 0 })
    const editorRef: any = useRef(null)

    function insertCode(code: string) {
        editorRef.current.editor.session.insert(position, code)

        const x = editorRef.current.editor.getValue()

        try {
            const res = prettier.format(x, {
                semi: false,
                tabWidth: 4,
                parser: 'babel',
                plugins: [parser]
            })

            setCode(res)
        } catch (e) {
            console.log(e.message)
        }
    }

    function updateCode(code: string) {
        setCode(code)
    }
    function setShowBigVisualHandler() {
        setShowBigVisual(!showBigVisual)
    }

    let xx = {}
    let cf = ''
    try {
        eval(code.replace('module.exports', 'xx'))
        // const cf1 = JSON.stringify(make(xx), null, 2)
        cf = YAML.stringify(make(xx))
        cf = `${cf}`
            .split('"2018-05-29"')
            .join('VERSION')
            .split('- ""')
            .join('FNJOIN')
            .split(`\\"`)
            .join('QUOTE')
            .split('"')
            .join('')
            .split('QUOTE')
            .join('"')
            .split('FNJOIN')
            .join('- ""')
            .split('VERSION')
            .join('"2018-05-29"')
            .split('\\n')
            .join('\n')
            .split('\\t')
            .join('\t')
            .split('RequestMappingTemplate:')
            .join('RequestMappingTemplate: |')
            .split('ResponseMappingTemplate:')
            .join('ResponseMappingTemplate: |')
            .split('ZipFile:')
            .join('ZipFile: |')
            .split('Definition:')
            .join('Definition: |')
    } catch (e) {
        //nothing
    }

    if (screen === 'edit') {
        return (
            <>
                <div className="editor">
                    <SideBar
                        updateCode={updateCode}
                        insertCode={insertCode}
                        showVisual={showVisual}
                        setShowVisual={setShowVisual}
                        setShowBigVisual={setShowBigVisualHandler}
                    ></SideBar>
                    <div className="content-container">
                        <AceEditor
                            ref={editorRef}
                            mode="javascript"
                            theme="dracula"
                            onChange={(x) => {
                                updateCode(x)
                            }}
                            value={code}
                            name="UNIQUE_ID_OF_DIV"
                            editorProps={{ $blockScrolling: true }}
                            width="100%"
                            height="600px"
                            onCursorChange={(selection) => {
                                const cursorPosition = selection.getCursor()
                                setPosition(cursorPosition)
                            }}
                        />
                    </div>

                    {showVisual ? (
                        <Visual block={xx} />
                    ) : (
                        <div
                            className="go-container"
                            onClick={() => {
                                setScreen('done')
                            }}
                        >
                            <NextIcon></NextIcon>
                        </div>
                    )}
                </div>
                {showBigVisual && <Visual block={xx} />}
            </>
        )
    }

    const name = 'erf '
    const region = 'region'
    const packagejson = `{
  "scripts": {
    "deploy": "aws cloudformation deploy --stack-name=${name} --template-file=template.json --capabilities=CAPABILITY_NAMED_IAM --region=${region}",
    "remove": "aws cloudformation delete-stack --stack-name=${name} --region=${region}"
  }
}`

    return (
        <div className="editor">
            <div className="sidebar">
                <button
                    className="inject-button"
                    onClick={() => {
                        setDoneScreen('template')
                    }}
                >
                    template.json
                </button>
                <button
                    className="inject-button"
                    onClick={() => {
                        setDoneScreen('package')
                    }}
                >
                    package.json
                </button>
            </div>
            <div className="content-container">
                <AceEditor
                    ref={editorRef}
                    mode="javascript"
                    theme="dracula"
                    value={doneScreen === 'template' ? cf : packagejson}
                    name="UNIQUE_ID_OF_DIV2"
                    editorProps={{ $blockScrolling: true }}
                    setOptions={{
                        highlightActiveLine: false
                    }}
                    highlightActiveLine={false}
                    width="100%"
                    height="600px"
                    onCursorChange={(selection) => {
                        const cursorPosition = selection.getCursor()
                        setPosition(cursorPosition)
                    }}
                />
            </div>
            <div
                className="go-container"
                onClick={() => {
                    setScreen('edit')
                }}
            >
                <BackIcon></BackIcon>
            </div>
        </div>
    )
}
