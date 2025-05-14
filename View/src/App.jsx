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
  Paper,
  Chip,
  Grid2,
  Card,
  CardContent,
  Container,
  Divider,
  useTheme,
  alpha,
  Fade,
  Zoom,
  IconButton,
  Modal,
  Backdrop
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import DetailsIcon from "@mui/icons-material/Details";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import CloseIcon from "@mui/icons-material/Close";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";

const CLASS_LABELS = ['Hate Speech', 'LGBTQ', 'Mature', 'Neutral', 'Vulgar'];

const VideoUploader = () => {
  const [open, setOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [file, setFile] = useState(null);
  const [classificationResults, setClassificationResults] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [visualAnalysisResults, setVisualAnalysisResults] = useState(null);
  const [visualAnalysisLoading, setVisualAnalysisLoading] = useState(false);
  const [sortedClasses, setSortedClasses] = useState(null);
  const [imageOverlay, setImageOverlay] = useState({
    open: false,
    src: "",
    alt: ""
  });

  const tagStyles = {
    "Hate Speech": {
      color: "#FFFFFF",
      backgroundColor: "#d32f2f"
    },
    "LGBTQ": {
      color: "#FFFFFF",
      backgroundColor: "#9c27b0"
    },
    "Mature": {
      color: "#FFFFFF",
      backgroundColor: "#f57c00"
    },
    "Neutral": {
      color: "#FFFFFF",
      backgroundColor: "#2e7d32"
    },
    "Vulgar": {
      color: "#FFFFFF",
      backgroundColor: "#c2185b"
    }
  };

  const handleImageClick = (src, alt) => {
    setImageOverlay({
      open: true,
      src,
      alt
    });
  };

  const handleCloseOverlay = () => {
    setImageOverlay({
      ...imageOverlay,
      open: false
    });
  };

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
  
      let results;
      try {
        results = response.data;
  
        if (results && typeof results === "object" && !Array.isArray(results)) {
          results = Object.values(results);
        }
      } catch (parseError) {
        console.error("Failed to parse results:", parseError);
        throw new Error("Could not parse classification results");
      }
  
      setClassificationResults(results);
      setOpen(false);
    } catch (error) {
      console.error("Error during file upload", error);
      setClassificationResults(null);
    } finally {
      setLoadingResponse(false);
      setVisualAnalysisLoading(true);
      try {
        const response = await axios.get("http://localhost:8000/get_visual_analysis/");
        setVisualAnalysisResults(response.data);
        const sortedClassNames = Object.entries(response.data.class_frequency)
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => key);
        setSortedClasses(sortedClassNames);
      } catch (error) {
        console.error("Error fetching visual analysis", error);
      } finally {
        setVisualAnalysisLoading(false);
      }
    }
  };

  const getMostSevereClassification = () => {
    if (!classificationResults) return null;
  
    const filteredResults = classificationResults.filter((r) => r.label !== 3);
  
    if (filteredResults.length === 0) {
      return null;
    }
  
    const maxLabelIndex = Math.max(...filteredResults.map((r) => r.label));
    return CLASS_LABELS[maxLabelIndex];
  };
  
  const renderClassificationAlert = () => {
    const mostSevereClass = getMostSevereClassification();
  
    if (mostSevereClass === "Neutral") {
      return (
        <Zoom in={true}>
          <Alert 
            severity="success" 
            variant="filled"
            icon={<SecurityIcon />}
            sx={{ 
              mt: 4, 
              mb: 2,
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
            }}
          >
          Content appears neutral and safe for viewing
        </Alert>
        </Zoom>
      );
    } else {
      return (
        <Zoom in={true}>
        <Alert
          severity="error"
            variant="filled"
            icon={<SecurityIcon />}
          sx={{
              mt: 4,
              mb: 2,
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
            action={
          <Button 
                color="inherit" 
            size="small" 
            startIcon={<DetailsIcon />}
            onClick={() => setDetailsDialogOpen(true)}
                sx={{ 
                  fontWeight: "bold",
                  borderRadius: "8px",
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }
                }}
          >
            View Details
          </Button>
            }
          >
            Potentially inappropriate content detected: {mostSevereClass}
        </Alert>
        </Zoom>
      );
    }
  };
  
  const renderDetailsDialog = () => (
    <Dialog
      open={detailsDialogOpen}
      onClose={() => setDetailsDialogOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle sx={{ 
        background: "linear-gradient(to right, #3f51b5, #2196f3)",
        color: "white",
        py: 2.5,
        fontSize: "1.5rem",
        fontWeight: 500
      }}>
        Dialogue Classification Details
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid rgba(0, 0, 0, 0.08)" 
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", py: 2 }}>Dialogue 1</TableCell>
                <TableCell sx={{ fontWeight: "bold", py: 2 }}>Dialogue 2</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", py: 2 }}>Classification</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
  {classificationResults && classificationResults.map((result, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ py: 2 }}>{result.text.split("[SEP]")[0]}</TableCell>
                  <TableCell sx={{ py: 2 }}>{result.text.split("[SEP]")[1]}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>
                    <Chip 
                      label={CLASS_LABELS[result.label]} 
                      sx={{
                        backgroundColor: tagStyles[CLASS_LABELS[result.label]].backgroundColor,
                        color: tagStyles[CLASS_LABELS[result.label]].color,
                        fontWeight: 500,
                        px: 1
                      }} 
                    />
      </TableCell>
    </TableRow>
  ))}
</TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
  
  const renderImageOverlay = () => (
    <Modal
      open={imageOverlay.open}
      onClose={handleCloseOverlay}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
      }}
    >
      <Fade in={imageOverlay.open}>
        <Box
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            outline: 'none',
          }}
        >
          <IconButton
            onClick={handleCloseOverlay}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={imageOverlay.src}
            alt={imageOverlay.alt}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          />
        </Box>
      </Fade>
    </Modal>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #f9f9f9 0%, #f0f4f8 100%)",
        py: 6
      }}
    >
      <Container maxWidth="lg">
        <Fade in={true} timeout={800}>
    <Box
      sx={{
        display: "flex",
              flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
              mb: 6
      }}
    >
      <Typography
        variant="h1"
        sx={{
                fontWeight: 700,
          color: "#1a237e",
                fontSize: {xs: "2.5rem", md: "3.5rem"},
                letterSpacing: "-0.5px",
                mb: 1,
                background: "linear-gradient(90deg, #1a237e 0%, #3949ab 100%)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              PureToons
        <SecurityIcon
                sx={{ 
                  fontSize: {xs: "2.5rem", md: "3.5rem"}, 
                  ml: 1,
                  color: "#3949ab",
                  animation: "pulse 2s infinite ease-in-out",
                  "@keyframes pulse": {
                    "0%": { opacity: 0.7 },
                    "50%": { opacity: 1 },
                    "100%": { opacity: 0.7 }
                  }
                }}
        />
      </Typography>

      <Typography
              variant="h5"
        sx={{
                fontWeight: 500,
                color: "#546e7a",
                maxWidth: "700px",
                mb: 5,
                px: 2
              }}
            >
              Upload your content for intelligent AI classification and analysis
      </Typography>

      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={() => setOpen(true)}
              startIcon={<UploadFileIcon />}
        sx={{
                py: 1.5,
                px: 4,
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 10px 20px rgba(25, 118, 210, 0.15)",
                background: "linear-gradient(90deg, #1976d2 0%, #2196f3 100%)",
          transition: "all 0.3s ease",
          "&:hover": {
                  boxShadow: "0 12px 28px rgba(25, 118, 210, 0.25)",
                  transform: "translateY(-2px)",
          },
        }}
      >
        Upload Your Video
      </Button>
          </Box>
        </Fade>

      {classificationResults && renderClassificationAlert()}
      {renderDetailsDialog()}

      <Dialog
        open={open}
          onClose={() => !loadingResponse && setOpen(false)}
        fullWidth
        maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: "16px",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
              overflow: "hidden"
            }
          }}
      >
        <DialogTitle
          sx={{
              background: "linear-gradient(to right, #1976d2, #2196f3)",
              color: "white",
              py: 3,
              fontWeight: 600,
              fontSize: "1.4rem",
              textAlign: "center"
            }}
          >
            Upload Your Video
        </DialogTitle>
        <DialogContent
          sx={{
              p: 4,
              backgroundColor: "#ffffff",
          }}
        >
          {loadingResponse ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography
                variant="h6"
                  sx={{ mb: 3, fontWeight: 500, color: "#455a64" }}
              >
                  Analyzing your content...
              </Typography>
                <CircularProgress size={60} thickness={4} />
              {uploadProgress > 0 && (
                  <Box sx={{ mt: 3, width: "100%" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Progress</Typography>
                      <Typography variant="body2" color="primary" fontWeight={500}>{uploadProgress}%</Typography>
                    </Box>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "rgba(33, 150, 243, 0.1)",
                      "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          background: "linear-gradient(90deg, #1976d2 0%, #2196f3 100%)",
                      },
                    }}
                  />
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography 
                  variant="body1" 
                  sx={{ mb: 3, color: "#455a64" }}
                >
                  Select a video to analyze for content classification
                </Typography>
                <Box
                  sx={{
                    border: "2px dashed #1976d2",
                    borderRadius: "12px",
                    backgroundColor: "rgba(33, 150, 243, 0.04)",
                    py: 5,
                    px: 3,
                    mb: 3,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(33, 150, 243, 0.08)",
                      cursor: "pointer"
                    }
                  }}
                  onClick={() => document.getElementById("video-upload").click()}
                >
                  <UploadFileIcon sx={{ fontSize: 48, color: "#1976d2", mb: 2 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500, color: "#1976d2" }}>
                    Click to select a video file
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#78909c", mt: 1 }}>
                    or drag and drop your file here
                  </Typography>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </Box>
              </Box>
          )}
        </DialogContent>
      </Dialog>

        {visualAnalysisLoading && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={40} />
            <Typography sx={{ mt: 2, color: "#455a64" }}>
              Analyzing visual content...
            </Typography>
          </Box>
        )}

        {visualAnalysisResults && (
          <Fade in={true} timeout={1000}>
            <Card 
              elevation={0}
              sx={{ 
                mt: 4, 
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)"
              }}
            >
              <Box 
                sx={{ 
                  p: 3, 
                  background: "linear-gradient(to right, #3949ab, #5c6bc0)", 
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <AnalyticsIcon sx={{ color: "white", fontSize: 28, mr: 2 }} />
                <Typography variant="h5" sx={{ color: "white", fontWeight: 500 }}>
                  Visual Content Analysis
                </Typography>
              </Box>
              
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, color: "#455a64", fontWeight: 500 }}>
                  Classifications Detected
                </Typography>
                
                <Box sx={{ mb: 4, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {sortedClasses && sortedClasses.map((className, index) => (
                    <Chip
                      key={index}
                      label={className}
                      sx={{
                        backgroundColor: tagStyles[className]?.backgroundColor || "#3f51b5",
                        color: tagStyles[className]?.color || "white",
                        fontWeight: 500,
                        fontSize: "1rem",
                        py: 2.5,
                        px: 1,
                        borderRadius: "8px"
                      }}
                    />
                  ))}
                </Box>

                <Divider sx={{ my: 4 }} />
                
                <Typography variant="h6" sx={{ mb: 3, color: "#455a64", fontWeight: 500 }}>
                  Analyzed Frames
                </Typography>
                
                <Grid2 container spacing={3}>
                  {visualAnalysisResults && visualAnalysisResults.processed_frames.map((result, index) => (
                    <Grid2 item xs={12} sm={6} md={4} key={index}>
                      <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                        <Card 
                          elevation={0}
                          sx={{ 
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "1px solid rgba(0, 0, 0, 0.08)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: "0 12px 24px rgba(0, 0, 0, 0.1)"
                            },
                            cursor: "pointer",
                            position: "relative"
                          }}
                          onClick={() => handleImageClick(`http://localhost:8000/${result.path}`, result.tag || `Frame ${index + 1}`)}
                        >
                          <Box sx={{ position: "relative" }}>
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: "rgba(0, 0, 0, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: 0,
                                transition: "opacity 0.3s ease",
                                "&:hover": {
                                  opacity: 1
                                },
                                zIndex: 1
                              }}
                            >
                              <ZoomOutMapIcon sx={{ color: "white", fontSize: "2rem" }} />
                            </Box>
                            <img 
                              src={`http://localhost:8000/${result.path}`} 
                              alt={result.tag} 
            style={{
                                width: "100%",
                                height: "220px",
                                objectFit: "cover"
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: "8px 12px",
                                background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                                display: "flex",
                                justifyContent: "flex-end"
                              }}
                            >
                              <Chip
                                label={`Frame ${index + 1}`}
                                size="small"
                                sx={{
                                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                                  color: "white",
                                  fontWeight: 500,
                                  fontSize: "0.75rem"
                                }}
                              />
                            </Box>
                          </Box>
                        </Card>
                      </Zoom>
          </Grid2>
        ))}
      </Grid2>
              </CardContent>
            </Card>
          </Fade>
        )}
      </Container>
      
      {renderImageOverlay()}
    </Box>
  );
};

export default VideoUploader;