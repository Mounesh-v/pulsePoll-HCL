package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

/*
voter token for the We need to identify whether someone has already voted in a particular poll.
We'll issue an anonymous, random voter token and store it in a secure browser cookie.
It is not a replacement for identity verification: someone can use another browser or clear cookies.
We'll explain that limitation in the README.
*/
type Vote struct {
	ID         bson.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID     bson.ObjectID `bson:"pollId" json:"pollId"`
	OptionID   string        `bson:"optionId" json:"optionId"`
	VoterToken string        `bson:"voterToken" json:"-"`
	CreatedAt  time.Time     `bson:"createdAt" json:"createdAt"`
}
