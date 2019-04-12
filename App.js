import React, {Component} from 'react';
import {ScrollView, Platform, StyleSheet, Text, View} from 'react-native';

import { withAuthenticator } from 'aws-amplify-react-native'

import { API, graphqlOperation } from 'aws-amplify'
import { Button, FormInput } from 'react-native-elements'

import { listTalks as ListTalks } from './graphql/queries'
import { createTalk as CreateTalk } from './graphql/mutations'
import { onCreateTalk as OnCreateTalk } from './graphql/subscriptions'

class App extends Component<Props> {
  state = {
    name: '', speakerName: '', speakerBio: '', talks: []
  }
  async componentDidMount() {
    try {
      const talkData = await API.graphql(graphqlOperation(ListTalks))
      console.log('talkData: ', talkData)
      this.setState({ talks: talkData.data.listTalks.items })
    } catch (err) {
      console.log('err: ', err)
    }
    API.graphql(
      graphqlOperation(OnCreateTalk)
    )
    .subscribe({
      next: data => {
        const { value: { data: { onCreateTalk }}} = data
        let isDuplicate = false
        this.state.talks.forEach(t => {
          if (t.name === onCreateTalk.name) isDuplicate = true
        })
        if (isDuplicate) return
        const talks = [
          ...this.state.talks,
          onCreateTalk
        ]
        this.setState({ talks })
      }
    })
  }
  onChange = (k, v) => this.setState({ [k]: v })
  createTalk = async () => {
    const talk = {
      name: this.state.name,
      speakerName: this.state.speakerName,
      speakerBio: this.state.speakerBio,
    }
    const talks = [...this.state.talks, talk]
    this.setState({ talks, name: '', speakerName: '', speakerBio: '' })
    try {
    await API.graphql(graphqlOperation(CreateTalk, { input: talk }))
    console.log('talk successfully created!!!')
    } catch (err) {
      console.log('error: ', err)
    }
  }
  render() {
    return (
      <View style={styles.wrapper}>
        <FormInput
          onChangeText={v => this.onChange('name', v)}
          placeholder='Talk Name'
          value={this.state.name}
        />
        <FormInput
          onChangeText={v => this.onChange('speakerName', v)}
          placeholder='Speaker Name'
          value={this.state.speakerName}
        />
        <FormInput
          onChangeText={v => this.onChange('speakerBio', v)}
          placeholder='Speaker Bio'
          value={this.state.speakerBio}
        />
        <Button
          style={{ margin: 20 }}
          onPress={this.createTalk}
          title='Create Talk'
          textStyle={{ color: 'black' }}
          backgroundColor='#00dd3b'
        />
        <ScrollView>
        {
          this.state.talks.map((t, i) => (
            <View key={i} style={styles.container}>
              <Text style={styles.heading}>{t.name}</Text>
              <Text style={styles.text}>{t.speakerName}</Text>
              <Text style={styles.subtitle} >{t.speakerBio}</Text>
            </View>
          ))
        }
        </ScrollView>
      </View>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: true })

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 20
  },
  container: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, .5)',
  },
  heading: {
    fontSize: 20,
    marginBottom: 5
  },
  text: {
    color: 'rgba(0, 0, 0, .3)',
    fontSize: 16,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
  }
})
