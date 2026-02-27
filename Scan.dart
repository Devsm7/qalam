import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

/// Service class for Roboflow AI Classification API
class ScanAIService {
  // Roboflow API configuration
  static const String baseUrl = 'https://serverless.roboflow.com';
  static const String apiKey = 'ITfUpuY5QO9WTBpcEXTh';
  static const String modelId = 'khatclass/1';

  /// Classify an image using Roboflow Classification API
  /// Based on Roboflow serverless API documentation for classification models
  ///
  /// [imageFile] - The image file to classify
  /// Returns a map containing the classification results
  static Future<Map<String, dynamic>> classifyImage(File imageFile) async {
    // Roboflow serverless API format: POST /infer/{model_id}
    // Try multipart form data first (most common for file uploads)
    var result = await _tryRoboflowClassificationAPI(imageFile);
    if (result['success'] == true) return result;

    // Fallback: Try base64 JSON format
    result = await _tryBase64JSONFormat(imageFile);
    if (result['success'] == true) return result;

    // If all fail, return the last error
    return result;
  }

  /// Try Roboflow Classification API format
  /// Based on Roboflow serverless API documentation
  /// Trying multiple endpoint formats for classification models
  static Future<Map<String, dynamic>> _tryRoboflowClassificationAPI(
    File imageFile,
  ) async {
    final imageBytes = await imageFile.readAsBytes();
    final imageInfo = _getImageInfo(imageFile);

    // Try different endpoint formats for classification models
    // Format 1: POST /infer/{model_id} (standard format)
    var result = await _tryMultipartRequest(
      '$baseUrl/infer/$modelId',
      imageBytes,
      imageInfo,
    );
    if (result['success'] == true) return result;

    // Format 2: POST /classify/{model_id} (classification-specific endpoint)
    result = await _tryMultipartRequest(
      '$baseUrl/classify/$modelId',
      imageBytes,
      imageInfo,
    );
    if (result['success'] == true) return result;

    // Format 3: POST /infer with model_id in query parameter
    result = await _tryMultipartRequestWithQuery(
      '$baseUrl/infer',
      imageBytes,
      imageInfo,
    );
    if (result['success'] == true) return result;

    // Format 4: POST /{model_id} (direct model endpoint)
    result = await _tryMultipartRequest(
      '$baseUrl/$modelId',
      imageBytes,
      imageInfo,
    );
    if (result['success'] == true) return result;

    // Return the last error
    return result;
  }

  /// Try multipart request to a specific endpoint
  static Future<Map<String, dynamic>> _tryMultipartRequest(
    String endpoint,
    List<int> imageBytes,
    Map<String, String> imageInfo,
  ) async {
    try {
      final uri = Uri.parse(
        endpoint,
      ).replace(queryParameters: {'api_key': apiKey});

      // Try with 'file' field first
      var request = http.MultipartRequest('POST', uri);
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          imageBytes,
          filename: imageInfo['filename']!,
          contentType: MediaType.parse(imageInfo['mime']!),
        ),
      );

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      }

      // If 'file' fails with 400/422, try 'image' field
      if (response.statusCode == 400 || response.statusCode == 422) {
        request = http.MultipartRequest('POST', uri);
        request.files.add(
          http.MultipartFile.fromBytes(
            'image',
            imageBytes,
            filename: imageInfo['filename']!,
            contentType: MediaType.parse(imageInfo['mime']!),
          ),
        );

        streamedResponse = await request.send();
        response = await http.Response.fromStream(streamedResponse);

        if (response.statusCode == 200) {
          return {'success': true, 'data': json.decode(response.body)};
        }
      }

      return {
        'success': false,
        'error': 'Multipart request failed: ${response.statusCode}',
        'message': response.body,
        'endpoint': uri.toString(),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Multipart request error: $e',
        'endpoint': endpoint,
      };
    }
  }

  /// Try multipart request with model_id as query parameter
  static Future<Map<String, dynamic>> _tryMultipartRequestWithQuery(
    String endpoint,
    List<int> imageBytes,
    Map<String, String> imageInfo,
  ) async {
    try {
      final uri = Uri.parse(
        endpoint,
      ).replace(queryParameters: {'api_key': apiKey, 'model_id': modelId});

      var request = http.MultipartRequest('POST', uri);
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          imageBytes,
          filename: imageInfo['filename']!,
          contentType: MediaType.parse(imageInfo['mime']!),
        ),
      );

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      }

      return {
        'success': false,
        'error': 'Multipart with query param failed: ${response.statusCode}',
        'message': response.body,
        'endpoint': uri.toString(),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Multipart with query param error: $e',
        'endpoint': endpoint,
      };
    }
  }

  /// Try base64 JSON format (alternative format for Roboflow API)
  static Future<Map<String, dynamic>> _tryBase64JSONFormat(
    File imageFile,
  ) async {
    try {
      final imageBytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(imageBytes);

      // Roboflow serverless API with base64 image
      final uri = Uri.parse(
        '$baseUrl/infer/$modelId',
      ).replace(queryParameters: {'api_key': apiKey});

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'image': base64Image}),
      );

      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      }

      return {
        'success': false,
        'error': 'Base64 JSON format failed: ${response.statusCode}',
        'message': response.body,
        'endpoint': uri.toString(),
      };
    } catch (e) {
      return {'success': false, 'error': 'Base64 JSON format error: $e'};
    }
  }

  /// Get image MIME type and extension from file
  static Map<String, String> _getImageInfo(File imageFile) {
    final path = imageFile.path.toLowerCase();
    if (path.endsWith('.png')) {
      return {'mime': 'image/png', 'ext': 'png', 'filename': 'image.png'};
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      return {'mime': 'image/jpeg', 'ext': 'jpg', 'filename': 'image.jpg'};
    } else if (path.endsWith('.webp')) {
      return {'mime': 'image/webp', 'ext': 'webp', 'filename': 'image.webp'};
    }
    // Default to JPEG
    return {'mime': 'image/jpeg', 'ext': 'jpg', 'filename': 'image.jpg'};
  }

  /// Classify an image from a URL
  ///
  /// [imageUrl] - The URL of the image to classify
  /// Returns a map containing the classification results
  static Future<Map<String, dynamic>> classifyImageFromUrl(
    String imageUrl,
  ) async {
    try {
      final uri = Uri.parse(
        '$baseUrl/infer/$modelId',
      ).replace(queryParameters: {'api_key': apiKey, 'image': imageUrl});

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        return {'success': true, 'data': jsonResponse};
      } else {
        return {
          'success': false,
          'error': 'API request failed with status ${response.statusCode}',
          'message': response.body,
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Failed to classify image: $e'};
    }
  }

  /// Extract the top prediction from the API response
  ///
  /// [response] - The response map from classifyImage
  /// Returns the top prediction class and confidence
  static Map<String, dynamic>? getTopPrediction(Map<String, dynamic> response) {
    if (!response['success'] || response['data'] == null) {
      return null;
    }

    final data = response['data'];

    // Roboflow classification API typically returns predictions in a 'predictions' array
    if (data['predictions'] != null &&
        (data['predictions'] as List).isNotEmpty) {
      final predictions = data['predictions'] as List;
      final topPrediction = predictions.first;

      return {
        'class':
            topPrediction['class'] ??
            topPrediction['predicted_class'] ??
            'Unknown',
        'confidence':
            topPrediction['confidence'] ?? topPrediction['score'] ?? 0.0,
        'allPredictions': predictions,
      };
    }

    // Alternative format: direct class and confidence
    if (data['class'] != null || data['predicted_class'] != null) {
      return {
        'class': data['class'] ?? data['predicted_class'] ?? 'Unknown',
        'confidence': data['confidence'] ?? data['score'] ?? 0.0,
        'allPredictions': [data],
      };
    }

    return null;
  }
}
