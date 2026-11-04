package repository

import (
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/core"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

func PrintBalanceSheet(pool *pgxpool.Pool, clubID string) (core.Maroto, error) {
	ctg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(10).
		WithTopMargin(15).
		Build()

	collections, err := getCollections(pool, clubID)
	if err != nil {
		return nil, fmt.Errorf("get collections: %w", err)
	}

	expenses, err := getExpenses(pool, clubID)
	if err != nil {
		return nil, fmt.Errorf("get expenses: %w", err)
	}

	m := maroto.New(ctg)

	balanceSheetHeader, err := getBalanceSheetHeader(pool, clubID)
	if err != nil {
		return nil, fmt.Errorf("get header: %w", err)
	}

	m.AddRows(balanceSheetHeader...)

	m.AddRows(getSectionHeader("Collections"))
	m.AddRows(row.New(3).Add(col.New(12))) // 3 unit spacing
	m.AddRows(collections...)

	m.AddRows(getSectionHeader("Expenses"))
	m.AddRows(row.New(3).Add(col.New(12))) // 3 unit spacing
	m.AddRows(expenses...)

	return m, nil
}

func getCollections(pool *pgxpool.Pool, clubID string) ([]core.Row, error) {
	rows := []core.Row{
		row.New(5).Add(
			col.New(2),
			text.NewCol(3, "Name", props.Text{Size: 9, Align: align.Center, Style: fontstyle.Bold}),
			text.NewCol(10, "Amount", props.Text{Size: 9, Align: align.Center, Style: fontstyle.Bold}),
		),
	}

	var contentsRow []core.Row
	contents, err := GetAllCollections(pool, clubID)
	if err != nil {
		return nil, fmt.Errorf("fetch collections: %w", err)
	}

	for i, content := range contents {
		amount, err := numericToString(content.Amount)
		if err != nil {
			return nil, err
		}

		r := row.New(4).Add(
			col.New(2),
			text.NewCol(3, content.DonorName, props.Text{Size: 8, Align: align.Center}),
			text.NewCol(10, amount, props.Text{Size: 8, Align: align.Center}),
		)

		if i%2 == 0 {
			gray := getGrayColor()
			r.WithStyle(&props.Cell{BackgroundColor: gray})
		}

		contentsRow = append(contentsRow, r)
	}

	rows = append(rows, contentsRow...)
	totalCollectionAmount, err := GetTotalCollectionByClubID(pool, clubID)
	if err != nil {
		return nil, fmt.Errorf("fetch total collections: %w", err)
	}

	rows = append(rows, row.New(20).Add(
		col.New(7),
		text.NewCol(2, "Total:", props.Text{
			Top:   5,
			Style: fontstyle.Bold,
			Size:  8,
			Align: align.Right,
		}),
		text.NewCol(2, "Rs "+totalCollectionAmount, props.Text{
			Top:   5,
			Style: fontstyle.Bold,
			Size:  8,
			Align: align.Center,
		}),
	))

	rows = append(rows, row.New(40).Add(
		col.New(12),
	))

	return rows, nil
}

func getExpenses(pool *pgxpool.Pool, clubID string) ([]core.Row, error) {
	rows := []core.Row{
		row.New(5).Add(
			col.New(1),
			text.NewCol(3, "Item", props.Text{Size: 9, Align: align.Center, Style: fontstyle.Bold}),
			text.NewCol(3, "Quantity", props.Text{Size: 9, Align: align.Center, Style: fontstyle.Bold}),
			text.NewCol(6, "Amount", props.Text{Size: 9, Align: align.Center, Style: fontstyle.Bold}),
		),
	}

	var contentsRow []core.Row
	contents, _ := GetAllExpenses(pool, clubID)

	for i, content := range contents {
		amount, err := numericToString(content.Amount)
		if err != nil {
			return nil, err
		}

		r := row.New(4).Add(
			col.New(1),
			text.NewCol(3, content.ProductName, props.Text{Size: 8, Align: align.Center}),
			text.NewCol(3, content.Quantity, props.Text{Size: 8, Align: align.Center}),
			text.NewCol(6, amount, props.Text{Size: 8, Align: align.Center}),
		)

		if i%2 == 0 {
			gray := getGrayColor()
			r.WithStyle(&props.Cell{BackgroundColor: gray})
		}

		contentsRow = append(contentsRow, r)
	}

	rows = append(rows, contentsRow...)
	totalExpenseAmount, _ := GetTotalExpensesByClubID(pool, clubID)

	rows = append(rows, row.New(20).Add(
		col.New(7),
		text.NewCol(2, "Total:", props.Text{
			Top:   5,
			Style: fontstyle.Bold,
			Size:  8,
			Align: align.Right,
		}),
		text.NewCol(2, "Rs "+totalExpenseAmount, props.Text{
			Top:   5,
			Style: fontstyle.Bold,
			Size:  8,
			Align: align.Center,
		}),
	))

	return rows, nil
}

func getGrayColor() *props.Color {
	return &props.Color{
		Red:   200,
		Green: 200,
		Blue:  200,
	}
}

func numericToString(amount pgtype.Numeric) (string, error) {
	if !amount.Valid {
		return "0.00", nil
	}

	value, err := amount.Value()
	if err != nil {
		return "", fmt.Errorf("failed to convert numeric value: %w", err)
	}

	return fmt.Sprint(value), nil
}

func getBalanceSheetHeader(pool *pgxpool.Pool, clubID string) ([]core.Row, error) {
	clubDetail, err := GetClubByID(pool, clubID)
	if err != nil {
		return nil, fmt.Errorf("fetch club details: %v", err.Error())
	}

	generatedAt := time.Now().Format("02 January 2006")
	year := time.Now().Format("2006")

	return []core.Row{
		// Brand name
		row.New(10).Add(
			text.NewCol(12, "ECHANDA", props.Text{
				Size:  20,
				Align: align.Center,
				Style: fontstyle.Bold,
			}),
		),

		// Report title
		row.New(7).Add(
			text.NewCol(12, clubDetail.Title, props.Text{
				Size:  16,
				Align: align.Center,
				Style: fontstyle.Bold,
			}),
		),
		row.New(3).Add(
			col.New(12),
		),
		row.New(10).Add(
			text.NewCol(12, "BALANCE SHEET ("+year+")", props.Text{
				Size:  10,
				Align: align.Center,
				Style: fontstyle.Bold,
			}),
		),

		// Club ID and generation date
		row.New(8).Add(
			text.NewCol(12, "Generated: "+generatedAt, props.Text{
				Size:  9,
				Align: align.Right,
			}),
		),

		// Separator
		row.New(0).Add(
			col.New(12),
		).WithStyle(&props.Cell{
			BackgroundColor: getGrayColor(),
		}),

		// Spacing before the tables
		row.New(5).Add(
			col.New(12),
		),
	}, nil
}

func getSectionHeader(title string) core.Row {
	var bgColor *props.Color
	if title == "Collections" {
		bgColor = getGreenColor()
	} else {
		bgColor = getRedColor()
	}

	return row.New(8).Add(
		text.NewCol(12, title, props.Text{
			Size:  14,
			Align: align.Center,
			Style: fontstyle.Bold,
		}),
	).WithStyle(&props.Cell{
		BackgroundColor: bgColor,
	})
}

func getGreenColor() *props.Color {
	return &props.Color{Red: 204, Green: 255, Blue: 204}
}

func getRedColor() *props.Color {
	return &props.Color{Red: 247, Green: 204, Blue: 204}
}
