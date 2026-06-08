package models

import "time"

// CashSession represents an open or closed cash register session
type CashSession struct {
	ID                  string     `json:"id"`
	ShopID              string     `json:"shop_id"`
	EmployeeID          string     `json:"employee_id"`
	EmployeeName        string     `json:"employee_name"`
	StartTime           *time.Time `json:"start_time,omitempty"`
	EndTime             *time.Time `json:"end_time,omitempty"`
	Status              string     `json:"status"` // open, closed
	OpeningBalance      float64    `json:"opening_balance"`
	ClosingBalance      *float64   `json:"closing_balance,omitempty"`
	CashSales           float64    `json:"cash_sales"`
	TransferSales       float64    `json:"transfer_sales"`
	TotalSales          float64    `json:"total_sales"`
	TotalExpenses       float64    `json:"total_expenses"`
	UnregisteredSales   float64    `json:"unregistered_sales"`
	ExpectedCashInBox   float64    `json:"expected_cash_in_box"`
	Difference          float64    `json:"difference"`
	Notes               *string    `json:"notes,omitempty"`
}

// Expense represents an operational expense recorded during a session or standalone
type Expense struct {
	ID                     string     `json:"id"`
	ShopID                 string     `json:"shop_id"`
	Description            string     `json:"description"`
	Amount                 float64    `json:"amount"`
	Category               string     `json:"category"` // operacional, servicios, salarios, marketing, otro
	RecordedByEmployeeID   string     `json:"recorded_by_employee_id"`
	SessionID              *string    `json:"session_id,omitempty"`
	OwnerID                *string    `json:"owner_id,omitempty"`
	CreatedAt              *time.Time `json:"created_at,omitempty"`
}
