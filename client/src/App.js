import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import { v4 as uuidV4 } from 'uuid'
import TextEditor from './TextEditor'

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path='/'>
          <Redirect to={`/documents/${ uuidV4() }`} />
        </Route>
        <Route exact path='/documents/:id'>
          <TextEditor />
        </Route>
      </Switch>
    </Router>
  )
}

export default App
