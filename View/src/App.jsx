import React, { useState } from "react";
import axios from "axios";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  LinearProgress,
  Typography,
  Box,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import DetailsIcon from "@mui/icons-material/Details";

const CLASS_LABELS = ['Hate Speech', 'LGBTQ', 'Mature', 'Neutral', 'Vulgar'];


const VideoUploader = () => {
  const [open, setOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [file, setFile] = useState(null);
  const [classificationResults, setClassificationResults] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      await uploadVideo(selectedFile);
    }
  };

  const uploadVideo = async (file) => {
    setUploadProgress(0);
    setLoadingResponse(true);
    setClassificationResults(null);
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await axios.put("http://localhost:8000/upload-video/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
  
      console.log("Full Response:", response);
      console.log("Response Data:", response.data);
  
      let results;
      try {
        // Try parsing the response data
        results = response.data;
  
        // If results is an object with numerical keys, convert it to an array
        if (results && typeof results === "object" && !Array.isArray(results)) {
          results = Object.values(results);
        }
      } catch (parseError) {
        console.error("Failed to parse results:", parseError);
        throw new Error("Could not parse classification results");
      }
  
      console.log("Parsed Results:", results);
      setClassificationResults(results);
      setOpen(false);
    } catch (error) {
      console.error("Error during file upload", error);
      setClassificationResults(null);
    } finally {
      setLoadingResponse(false);
    }
  };
  

  const getMostSevereClassification = () => {
    if (!classificationResults) return null;
  
    // Filter out "Neutral" (assuming it's at index 3 in CLASS_LABELS)
    const filteredResults = classificationResults.filter((r) => r.label !== 3);
  
    if (filteredResults.length === 0) {
      return null; // Return null if all classifications are "Neutral"
    }
  
    // Find the highest severity label index among non-neutral results
    const maxLabelIndex = Math.max(...filteredResults.map((r) => r.label));
    return CLASS_LABELS[maxLabelIndex];
  };
  
  
  const renderClassificationAlert = () => {
    const mostSevereClass = getMostSevereClassification();
  
    if (mostSevereClass === "Neutral") {
      return (
        <Alert severity="success" sx={{ mt: 2 }}>
          Content appears neutral and safe for viewing
        </Alert>
      );
    } else {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Potentially inappropriate content detected: {mostSevereClass}
          <Button 
            color="error" 
            size="small" 
            startIcon={<DetailsIcon />}
            onClick={() => setDetailsDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            View Details
          </Button>
        </Alert>
      );
    }
  };
  
  const renderDetailsDialog = () => (
    <Dialog
      open={detailsDialogOpen}
      onClose={() => setDetailsDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Dialogue Classification Details</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dialogue</TableCell>
                <TableCell align="right">Classification</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
  {classificationResults && classificationResults.map((result, index) => (
    <TableRow key={index}>
      <TableCell>{result.text}</TableCell>
      <TableCell align="right">
        {CLASS_LABELS[result.label]}
      </TableCell>
    </TableRow>
  ))}
</TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
  

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Typography
        variant="h1"
        sx={{
          marginBottom: "50px",
          fontWeight: "bold",
          color: "darkmagenta",
        }}
      >
        Pure Toons{" "}
        <SecurityIcon
          color="secondary"
          sx={{ fontSize: "4rem", marginLeft: "10px" }}
        />
      </Typography>

      <Typography
        variant="h4"
        sx={{
          marginBottom: "20px",
          fontWeight: "bold",
          color: "#1976d2",
        }}
      >
        Video Upload Interface
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={() => setOpen(true)}
        sx={{
          padding: "10px 20px",
          borderRadius: "30px",
          fontSize: "16px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 6px 15px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        Upload Your Video
      </Button>

      {classificationResults && renderClassificationAlert()}
      {renderDetailsDialog()}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.5rem",
            paddingBottom: "16px",
            color: "#1976d2",
          }}
        >
          Upload Video
        </DialogTitle>
        <DialogContent
          sx={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          {loadingResponse ? (
            <>
              <Typography
                variant="h6"
                sx={{ marginBottom: "10px", color: "#1976d2" }}
              >
                Processing your video...
              </Typography>
              <CircularProgress />
            </>
          ) : (
            <>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                style={{
                  display: "block",
                  margin: "20px auto",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f5f5f5",
                  fontSize: "14px",
                  color: "#333",
                }}
              />
              {uploadProgress > 0 && (
                <>
                  <Typography
                    variant="body2"
                    sx={{
                      marginTop: "10px",
                      color: "#1976d2",
                      fontWeight: "500",
                    }}
                  >
                    Processing... {uploadProgress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      marginTop: "10px",
                      height: "8px",
                      borderRadius: "5px",
                      backgroundColor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#1976d2",
                      },
                    }}
                  />
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VideoUploader;