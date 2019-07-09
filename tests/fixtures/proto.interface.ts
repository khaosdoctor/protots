interface Person {
  name: string
  id: number
  isFriend: boolean
  phones: PhoneNumber[]
}

interface PhoneNumber {
  number: string
  type?: PhoneType
}

interface PhoneType {
  type?: string
}

interface AddressBook {
  people: Person[]
}
