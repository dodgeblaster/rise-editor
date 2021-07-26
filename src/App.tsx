import React from 'react'
import './App.css'
import Editor from './components/SimpleEditor'
import Header from './components/Header'
function App() {
    return (
        <>
            <Header />
            <div className="root">
                <Editor />
            </div>
        </>
    )
}

export default App
