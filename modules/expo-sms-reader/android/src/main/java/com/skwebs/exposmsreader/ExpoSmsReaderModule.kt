package com.skwebs.exposmsreader

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoSmsReaderModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ExpoSmsReader")

    AsyncFunction("getSms") { options: Map<String, Any> ->

      val reactContext =
        requireNotNull(appContext.reactContext) {
          "React context is not available"
        }

      val maxCount =
        (options["maxCount"] as? Number)?.toInt() ?: 20

      val smsList =
        mutableListOf<Map<String, Any>>()

      val contentResolver: ContentResolver =
        reactContext.contentResolver

      val cursor: Cursor? =
        contentResolver.query(
          Uri.parse("content://sms/inbox"),
          arrayOf(
            "_id",
            "address",
            "body",
            "date",
            "read",
            "type",
            "thread_id"
          ),
          null,
          null,
          "date DESC"
        )

      cursor?.use {

        val idIndex =
          it.getColumnIndexOrThrow("_id")

        val addressIndex =
          it.getColumnIndexOrThrow("address")

        val bodyIndex =
          it.getColumnIndexOrThrow("body")

        val dateIndex =
          it.getColumnIndexOrThrow("date")

        val readIndex =
          it.getColumnIndexOrThrow("read")

        val typeIndex =
          it.getColumnIndexOrThrow("type")

        val threadIdIndex =
          it.getColumnIndexOrThrow("thread_id")

        var count = 0

        while (
          it.moveToNext() &&
          count < maxCount
        ) {

          val sms =
            mutableMapOf<String, Any>()

          sms["_id"] =
            it.getString(idIndex) ?: ""

          sms["address"] =
            it.getString(addressIndex) ?: ""

          sms["body"] =
            it.getString(bodyIndex) ?: ""

          sms["date"] =
            it.getLong(dateIndex)

          sms["read"] =
            it.getInt(readIndex)

          sms["type"] =
            it.getInt(typeIndex)

          sms["thread_id"] =
            it.getInt(threadIdIndex)

          smsList.add(sms)

          count++
        }
      }

      return@AsyncFunction smsList
    }
  }
}