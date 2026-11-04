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

IPHash is a one-way SHA-256 hash of the client IP, used as a secondary deduplication key stored in
Redis. It is never exposed in API responses and is not stored in MongoDB (omitempty keeps it out).
*/
type Vote struct {
	ID         bson.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID     bson.ObjectID `bson:"pollId" json:"pollId"`
	OptionID   string        `bson:"optionId" json:"optionId"`
	VoterToken string        `bson:"voterToken" json:"-"`
	IPHash     string        `bson:"ipHash,omitempty" json:"-"`
	CreatedAt  time.Time     `bson:"createdAt" json:"createdAt"`
}
