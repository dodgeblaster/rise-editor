import ReactFlow from 'react-flow-renderer'
import './visual.css'

const PADDING = 60
const BLOCK_WIDTH = 120
const BLOCK_PADDING = 4
const BLOCK = BLOCK_WIDTH + BLOCK_PADDING

const PADDING_TOP = 25
const BLOCK_HEIGHT = 30
const BLOCK_BOTTOM_PADDING = 20
const BLOCK_Y = BLOCK_HEIGHT + BLOCK_BOTTOM_PADDING

const makeTitleBlock = (x: any) => {
    return {
        id: x.id,
        //type: 'input', // input node
        data: { label: x.name },
        position: {
            x: PADDING + BLOCK * 0,
            y: PADDING_TOP + BLOCK_Y * x.rowIndex
        },
        targetPosition: 'left',
        sourcePosition: 'right',
        className: 'title-block'
    }
}

const makeStartingBlock = (x: any) => {
    return {
        id: x.id,
        type: 'input', // input node
        data: { label: x.name },
        position: {
            x: PADDING + BLOCK * 0,
            y: PADDING_TOP + BLOCK_Y * x.rowIndex
        },
        targetPosition: 'left',
        sourcePosition: 'right',
        className: 'starting-block'
    }
}

const makeMiddleBlock = (x: any) => {
    return {
        id: x.id,

        data: { label: x.name === 'db' ? `db ${x.action}` : x.name },
        position: {
            x: PADDING + BLOCK * x.index,
            y: PADDING_TOP + BLOCK_Y * x.rowIndex
        },
        targetPosition: 'left',
        sourcePosition: 'right',
        className: `middle-block ${x.name}-block`
    }
}

const makeLastBlock = (x: any) => {
    return {
        id: x.id,
        type: 'output', // input node
        data: { label: x.name },
        position: {
            x: PADDING + BLOCK * x.index,
            y: PADDING_TOP + BLOCK_Y * x.rowIndex
        },
        targetPosition: 'left',
        sourcePosition: 'right',
        className: `last-block ${x.name}-block`
    }
}
const makeCostBlock = (x: any) => {
    return {
        id: x.id,

        data: { label: x.name },
        position: {
            x: PADDING + BLOCK * x.index,
            y: PADDING_TOP + BLOCK_Y * x.rowIndex
        },

        className: `last-block cost-block`
    }
}

const makeEdge = (x: any) => {
    return { id: x.id, source: x.source, target: x.target }
}

const elements = [
    {
        id: '1',
        type: 'input', // input node
        data: { label: 'startProcess' },
        position: { x: PADDING + BLOCK * 0, y: 25 },
        targetPosition: 'left',
        sourcePosition: 'right'
    },
    // default node
    {
        id: '2',
        // you can also pass a React component as a label
        data: { label: <div>Add</div> },
        position: { x: PADDING + BLOCK * 1, y: 25 },
        targetPosition: 'left',
        sourcePosition: 'right'
    },
    {
        id: '3',
        // type: 'output', // output node
        data: { label: 'db create' },
        position: { x: PADDING + BLOCK * 2, y: 25 },
        targetPosition: 'left',
        sourcePosition: 'right'
    },
    {
        id: '4',
        type: 'output', // output node
        data: { label: 'Est. Cost: $0.2/month' },
        position: { x: PADDING + BLOCK * 3, y: 25 },
        targetPosition: 'left',
        sourcePosition: 'right'
    },
    // animated edge
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3' },
    { id: 'e2-4', source: '3', target: '4' }
]
export default function Visual(props: any) {
    const el: any = elements

    let all: any = []
    let rowIndex = 0
    const addBlocks = (k: any, type: string) => {
        let items = props.block.resolvers[type][k]
        const xx = [
            {
                type: k
            },
            ...items
        ]

        xx.forEach((item: any, i: number, l: any) => {
            const isFirst = i === 0
            const isLast = l.length === i + 1 && !isFirst
            const isMiddle = !isLast && !isFirst

            if (isLast) {
                all.push(
                    makeMiddleBlock({
                        id: `${k}${i}`,
                        action: item.action || 'none',
                        name: item.type,
                        index: i,
                        rowIndex
                    })
                )
                all.push(
                    makeEdge({
                        id: `${k}${i - 1}-${k}${i}`,
                        source: `${k}${i - 1}`,
                        target: `${k}${i}`
                    })
                )
            }
            if (isMiddle) {
                all.push(
                    makeMiddleBlock({
                        id: `${k}${i}`,
                        action: item.action || 'none',
                        name: item.type,
                        index: i,
                        rowIndex
                    })
                )
                all.push(
                    makeEdge({
                        id: `${k}${i - 1}-${k}${i}`,
                        source: `${k}${i - 1}`,
                        target: `${k}${i}`
                    })
                )
            }
            if (isFirst) {
                all.push(
                    makeStartingBlock({
                        id: `${k}${i}`,
                        name: item.type,
                        index: i,
                        rowIndex
                    })
                )
            }
        })
        all.push(
            makeCostBlock({
                id: `${k}${xx.length}`,
                name: '$0.23 / month',
                index: xx.length,
                rowIndex
            })
        )
        rowIndex++
    }

    /**
     * Handle Queries
     *
     */
    const queryActions =
        props.block.resolvers && props.block.resolvers.Query
            ? Object.keys(props.block.resolvers.Query)
            : []
    if (queryActions.length > 0) {
        all.push(
            makeTitleBlock({
                id: `QueryTitle`,
                name: 'Queries',
                index: 0,
                rowIndex
            })
        )
        rowIndex++
        queryActions.forEach((x) => addBlocks(x, 'Query'))
    }

    /**
     * Handle Mutations
     *
     */

    const mutationActions =
        props.block.resolvers && props.block.resolvers.Mutation
            ? Object.keys(props.block.resolvers.Mutation)
            : []
    if (mutationActions.length > 0) {
        all.push(
            makeTitleBlock({
                id: `MutationTitle`,
                name: 'Mutations',
                index: 0,
                rowIndex
            })
        )
        rowIndex++
        mutationActions.forEach((x) => addBlocks(x, 'Mutation'))
    }

    /**
     * Handle Events
     *
     */
    const eventActions =
        props.block.resolvers && props.block.resolvers.Events
            ? Object.keys(props.block.resolvers.Events)
            : []

    if (eventActions.length > 0) {
        all.push(
            makeTitleBlock({
                id: `EventsTitle`,
                name: 'Events',
                index: 0,
                rowIndex
            })
        )
        rowIndex++
        eventActions.forEach((x) => addBlocks(x, 'Events'))
    }
    //mutationActions.forEach(addBlocks, 'Mutation')

    return (
        <div className="visual-editor">
            <ReactFlow elements={all} />
        </div>
    )
}
