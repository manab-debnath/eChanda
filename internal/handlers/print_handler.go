package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/repository"
)

func PrintBalanceSheetHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")

		// Generate balance sheet
		m, err := repository.PrintBalanceSheet(pool, clubID)
		if err != nil {
			log.Printf("Failed to create balance sheet: %v", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "Unable to generate balance sheet",
			})
			return
		}

		// Generate PDF document
		document, err := m.Generate()
		if err != nil {
			log.Printf("Failed to generate PDF: %v", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "Unable to generate PDF",
			})
			return
		}

		// Create temporary directory
		tempDir, err := os.MkdirTemp("", "echanda-balance-sheet-*")
		if err != nil {
			log.Printf("Failed to create temporary directory: %v", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "Unable to generate PDF",
			})
			return
		}
		defer os.RemoveAll(tempDir)

		filename := "balance-sheet-" + time.Now().Format("2006-01-02") + ".pdf"
		filePath := filepath.Join(tempDir, "balance-sheet.pdf")

		// Save PDF temporarily
		if err := document.Save(filePath); err != nil {
			log.Printf("Failed to save PDF: %v", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "Unable to save PDF",
			})
			return
		}

		// Read PDF
		pdfBytes, err := os.ReadFile(filePath)
		if err != nil {
			log.Printf("Failed to read PDF: %v", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "Unable to read PDF",
			})
			return
		}

		// Send PDF to client
		ctx.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		ctx.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}
